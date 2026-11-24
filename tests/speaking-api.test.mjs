import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const fixture = JSON.parse(await readFile(new URL("../../docs/system-design/speaking-v2-protocol.fixture.json", import.meta.url), "utf8"));
let dom; let vite; let speaking; let profile;

before(async () => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "https://engolearn.test/" });
  globalThis.window = dom.window;
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true }, appType: "custom" });
  [speaking, profile] = await Promise.all([
    vite.ssrLoadModule("/src/features/speaking/services/speaking-v2.service.ts"),
    vite.ssrLoadModule("/src/features/topic/services/topic-speaking-profile.service.ts"),
  ]);
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
