import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const fixture = JSON.parse(await readFile(new URL("../../docs/system-design/speaking-v2-protocol.fixture.json", import.meta.url), "utf8"));
const historyFixture = JSON.parse(await readFile(new URL("../../docs/system-design/speaking-access-history.fixture.json", import.meta.url), "utf8"));
let dom; let vite; let speaking; let profile; let historyNavigation;

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window;
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom" });
  [speaking, profile, historyNavigation] = await Promise.all([
    vite.ssrLoadModule("/src/features/speaking/services/speaking-v2.service.ts"),
    vite.ssrLoadModule("/src/features/topic/services/topic-speaking-profile.service.ts"),
    vite.ssrLoadModule("/src/features/speaking/utils/speaking-history-navigation.ts"),
  ]);
});

test("history reads keep group, parent, exact and account URL intentions distinct", () => {
  assert.deepEqual(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("tab=COMPLETED&page=2")),
    { kind: "account", tab: "COMPLETED", group: null, page: 2, topicPage: 0, inProgressPage: 0, otherPage: 0, completedPage: 0 });
  assert.deepEqual(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("parentTopicId=topic-1&parentPage=3&from=%2Fspeaking%2Fhistory%3Ftab%3DCOMPLETED")),
    { kind: "parent", topicId: "topic-1", page: 3, origin: "/speaking/history?tab=COMPLETED" });
  assert.deepEqual(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("scopeType=TOPIC_ITEM&topicId=topic-1&topicItemId=item-2&page=1&from=%2Ftopics%2Ftopic-1%2Fitems%2Fitem-2%2Fspeaking")),
    { kind: "exact", scope: { type: "TOPIC_ITEM", topicId: "topic-1", topicItemId: "item-2" }, page: 1, origin: "/topics/topic-1/items/item-2/speaking" });
  assert.equal(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("scopeType=TOPIC&topicId=topic-1&topicItemId=item-2")).kind, "invalid");
  assert.equal(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("topicId=topic-1")).kind, "invalid");
  assert.equal(historyNavigation.parseSpeakingHistoryIntent(new URLSearchParams("topicId=topic-1&scopeType=TOPIC&tab=COMPLETED")).kind, "invalid");
});

test("history links accept only same-origin history URLs and retain paging on result return", () => {
  assert.equal(historyNavigation.sanitizeSpeakingHistoryOrigin("/speaking/history?tab=COMPLETED&page=2", "https://engolearn.test"), "/speaking/history?tab=COMPLETED&page=2");
  assert.equal(historyNavigation.sanitizeSpeakingHistoryOrigin("https://attacker.test/speaking/history", "https://engolearn.test"), null);
  assert.equal(historyNavigation.sanitizeSpeakingHistoryOrigin("/speaking/history?scopeType=TOPIC&topicId=x&topicItemId=y", "https://engolearn.test"), null);
  assert.equal(historyNavigation.sanitizeSpeakingHistoryOrigin("/speaking/history?scopeType=TOPIC_ITEM&topicId=t&topicItemId=i&from=%2Ftopics%2Ft%2Fitems%2Fi%2Fspeaking", "https://engolearn.test"), "/speaking/history?scopeType=TOPIC_ITEM&topicId=t&topicItemId=i&from=%2Ftopics%2Ft%2Fitems%2Fi%2Fspeaking");
  assert.equal(historyNavigation.sanitizeSpeakingHistoryOrigin("/speaking/history?scopeType=TOPIC_ITEM&topicId=t&topicItemId=i&from=%2Ftopics%2Felsewhere%2Fitems%2Felsewhere%2Fspeaking", "https://engolearn.test"), null);
});

test("Speaking history service reads group and parent pages with abort signals", async t => {
  const calls = [];
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const parsed = new URL(url); calls.push({ path: parsed.pathname, params: Object.fromEntries(parsed.searchParams), signal: options.signal });
    if (parsed.pathname.endsWith("/history/topics")) return Response.json({ data: historyFixture.groups.response.data });
    if (parsed.pathname.endsWith("/sessions")) return Response.json({ data: historyFixture.parent.response.data });
    throw new Error(`Unexpected Speaking history request: ${parsed.pathname}`);
  });
  const groups = await speaking.speakingV2Service.historyTopics("IN_PROGRESS", 0, 9, controller.signal);
  const parent = await speaking.speakingV2Service.parentHistory("674300000000000000000001", 0, 2, controller.signal);
  assert.equal(groups.items[0].sessionCount, 3);
  assert.equal(parent.items[0].scope.type, "TOPIC_ITEM");
  assert.deepEqual(calls.map(({ path, params }) => ({ path, params })), [
    { path: "/api/v1/speaking/history/topics", params: { group: "IN_PROGRESS", page: "0", size: "9" } },
    { path: "/api/v1/speaking/history/topics/674300000000000000000001/sessions", params: { page: "0", size: "2" } },
  ]);
  assert.ok(calls.every(call => call.signal === controller.signal));
});
after(async () => { await vite?.close(); dom?.window.close(); delete globalThis.window; });

test("speaking availability and session create follow the shared fixture contract", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const parsed = new URL(url); const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ path: parsed.pathname, params: Object.fromEntries(parsed.searchParams), method: options.method, body });
    if (parsed.pathname.endsWith("/availability")) return Response.json({ data: fixture.rest.availability.topic.data });
    if (parsed.pathname.endsWith("/sessions")) return Response.json({ data: fixture.rest.create.response.data }, { status: 201 });
    throw new Error(`Unexpected Speaking API request: ${parsed.pathname}`);
  });
  const scope = fixture.rest.create.request.scope;
  const topicScope = { type: "TOPIC", topicId: scope.topicId, topicItemId: null };
  const available = await speaking.speakingV2Service.availability(topicScope);
  const created = await speaking.speakingV2Service.create(scope, fixture.rest.create.request.clientRequestId);
  assert.equal(available.available, true);
  assert.equal(created.sessionId, fixture.rest.create.response.data.sessionId);
  assert.deepEqual(calls[0], { path: "/api/v1/speaking/availability", params: { scopeType: topicScope.type, topicId: scope.topicId }, method: "GET", body: undefined });
  assert.deepEqual(calls[1].body, fixture.rest.create.request);
  assert.equal(calls[1].method, "POST");
});

test("Speaking API errors retain verified active session and retryable recovery hints", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    code: "ACTIVE_SESSION_EXISTS", detail: "A session is already active", retryable: true, activeSessionId: "existing-session",
  }, { status: 409 }));
  await assert.rejects(speaking.speakingV2Service.create(fixture.rest.create.request.scope, fixture.rest.create.request.clientRequestId), error => {
    assert.equal(error.code, "ACTIVE_SESSION_EXISTS");
    assert.equal(error.retryable, true);
    assert.equal(error.activeSessionId, "existing-session");
    return true;
  });
});

test("Topic profile reads, saves, and publishes preserve scope, revision, and resource IDs", async t => {
  const calls = [];
  const topicId = fixture.rest.create.request.scope.topicId;
  const itemId = fixture.rest.create.request.scope.topicItemId;
  const profileData = { revision: 0, draft: fixture.rest.profile.save.profile, published: null,
    contentVersion: "cafe-item-v1", resources: [{ id: "resource-id", type: "VOCABULARY", textEn: "orange juice" }] };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const parsed = new URL(url); const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ path: parsed.pathname, method: options.method, body });
    return Response.json({ data: { ...profileData, revision: body?.revision ?? profileData.revision + (options.method === "PUT" ? 1 : 0) } });
  });
  const state = await profile.topicSpeakingProfileService.get(topicId, itemId);
  await profile.topicSpeakingProfileService.save(topicId, itemId, state.revision, state.draft);
  await profile.topicSpeakingProfileService.publish(topicId, itemId, state.revision);
  const root = `/api/management/topics/${encodeURIComponent(topicId)}/items/${encodeURIComponent(itemId)}/speaking-profile`;
  assert.equal(calls[0].path, root);
  assert.deepEqual(calls[1], { path: root, method: "PUT", body: { revision: state.revision, profile: state.draft } });
  assert.deepEqual(calls[2], { path: `${root}/publish`, method: "POST", body: { revision: state.revision } });
  assert.equal(state.resources[0].id, "resource-id");
});
