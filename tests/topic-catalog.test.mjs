import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { createTopicCatalogService } from "../src/features/topic/services/topic-catalog.service.ts";
import { createTopicApi } from "../src/features/topic/services/topic-api.service.ts";
import { runTopicMutation } from "../src/features/topic/services/topic-mutation-journal.ts";
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "@shared/constants") return { url: new URL("../src/shared/constants/app.constants.ts", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
} });
const { readTopicFilters, mergeTopicPages, safeTopicOrigin, topicDetailPath, topicAttemptPath, primaryTopicItem, topicErrorMessage } = await import("../src/features/topic/utils/topic-catalog.ts");
const signal = new AbortController().signal;
const apiWith = data => createTopicCatalogService(createTopicApi({ fetchImpl: async () => Response.json({ data, timestamp: "2026-10-27T10:00:00Z" }) }));
const page = (ids, next = null) => ({ items: ids.map(topicId => ({ topicId })), total: 10, hasMore: next !== null, nextCursor: next });
test("URL filters support current level, C2, trimming and invalid-value normalization", () => {
  assert.deepEqual(readTopicFilters(new URLSearchParams("level=mine&sort=duration&q=%20cafe%20"), "B2"), { keyword: "cafe", level: "B2", selectedLevel: "mine", sort: "duration" });
  assert.equal(readTopicFilters(new URLSearchParams("level=mine"), null).selectedLevel, "all");
  assert.equal(readTopicFilters(new URLSearchParams("level=C2"), "A1").level, "C2");
  assert.equal(readTopicFilters(new URLSearchParams("level=bad&sort=bad"), "A1").sort, "recommended");
});
test("pagination appends, deduplicates, replaces metadata and resets on first page", () => {
  const first = page(["a", "b"], "one");
  const second = mergeTopicPages(first, page(["b", "c"]), "one");
  assert.deepEqual(second.items.map(x => x.topicId), ["a", "b", "c"]);
  assert.equal(second.hasMore, false);
  assert.deepEqual(mergeTopicPages(second, page(["new"]), null).items.map(x => x.topicId), ["new"]);
  const emptyMore = mergeTopicPages(first, page([], "two"), "one");
  assert.equal(emptyMore.items.length, 2);
  assert.equal(emptyMore.nextCursor, "two");
});
test("return destinations reject external/unrelated routes and preserve filters", () => {
  for (const value of ["https://evil.test", "//evil.test", "/admin/topics", "/topics/id", "/\\evil.test"]) assert.equal(safeTopicOrigin(value), "/topics");
  const origin = "/my-topics?tab=completed";
  const detail = new URL(topicDetailPath("id/1", origin), "https://test.invalid");
  assert.equal(detail.pathname, "/topics/id%2F1");
  assert.equal(detail.searchParams.get("from"), origin);
  const attempt = new URL(topicAttemptPath("t", "a/1", "/topics?q=food", "review"), "https://test.invalid");
  assert.equal(attempt.searchParams.get("mode"), "review");
  assert.equal(attempt.searchParams.get("from"), "/topics?q=food");
});
test("primary action follows server eligibility and prioritizes resume", () => {
  const item = (id, resume, start) => ({ topicItemId: id, actions: { continue: { allowed: resume }, start: { allowed: start } }, learningAttempt: resume ? { attemptId: "a" } : null });
  assert.equal(primaryTopicItem([item("new", false, true), item("running", true, false)]).topicItemId, "running");
  assert.equal(primaryTopicItem([item("locked", false, false)]), null);
});
test("viewer failures never become guest/default A1", async () => {
  await assert.rejects(apiWith({}).viewer(signal), e => e.code === "CONTRACT_MISMATCH");
  await assert.rejects(apiWith({ kind: "LEARNER", learnerId: "u", cefrLevel: null }).viewer(signal), e => e.code === "CONTRACT_MISMATCH");
  assert.equal((await apiWith({ kind: "GUEST", learnerId: null, cefrLevel: null, displayName: null }).viewer(signal)).kind, "GUEST");
});
test("legacy/malformed pages and missing metrics fail rather than rendering zero", async () => {
  await assert.rejects(apiWith({ items: [], hasMore: false, nextCursor: null }).discover({}, signal), e => e.code === "CONTRACT_MISMATCH");
  await assert.rejects(apiWith({ items: [], total: 0, hasMore: true, nextCursor: null }).discover({}, signal), e => e.code === "CONTRACT_MISMATCH");
  await assert.rejects(apiWith({ status: "NOT_STARTED", completedItemCount: 0, totalItemCount: 5, percent: 0 }).progress("t", signal), e => e.code === "CONTRACT_MISMATCH");
});
function storage() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
}
test("uncertain mutation retains key across callers, success clears it", async () => {
  const store = storage(), keys = [];
  const base = { scope: "A/start/1", storage: store, newKey: () => "original" };
  await assert.rejects(runTopicMutation({ ...base, run: async k => { keys.push(k); throw { status: 0 }; } }));
  await runTopicMutation({ ...base, newKey: () => "wrong", run: async k => { keys.push(k); } });
  await runTopicMutation({ ...base, newKey: () => "next", run: async k => { keys.push(k); } });
  assert.deepEqual(keys, ["original", "original", "next"]);
});
test("mutation keys are viewer-scoped and definitive 4xx clears pending action", async () => {
  const store = storage(), keys = [];
  await assert.rejects(runTopicMutation({ scope: "A", storage: store, newKey: () => "a", run: async () => { throw { status: 503 }; } }));
  await runTopicMutation({ scope: "B", storage: store, newKey: () => "b", run: async k => { keys.push(k); } });
  await assert.rejects(runTopicMutation({ scope: "A", storage: store, newKey: () => "wrong", run: async k => { keys.push(k); throw { status: 409 }; } }));
  await runTopicMutation({ scope: "A", storage: store, newKey: () => "a-new", run: async k => { keys.push(k); } });
  assert.deepEqual(keys, ["b", "a", "a-new"]);
});
test("storage failure prevents sending an untracked action", async () => {
  let called = false;
  await assert.rejects(runTopicMutation({ scope: "x", storage: { getItem() { throw Error("blocked"); }, setItem() {}, removeItem() {} }, run: async () => { called = true; } }), e => e.code === "LOCAL_STORAGE_UNAVAILABLE");
  assert.equal(called, false);
});
test("error copy uses codes and never exposes raw backend detail", () => {
  assert.match(topicErrorMessage({ code: "LEVEL_TOO_LOW" }), /Level/);
  assert.ok(!topicErrorMessage({ status: 503, message: "private stack" }).includes("private"));
});

function validCard(status) {
  return { topicId: "t", titleVi: "Chủ đề", cefrLevel: "A1", vocabularyCount: 15, quizCount: 30, durationMinutes: 50, totalItemCount: 5, hasNewContent: false, startAvailability: { allowed: true, reason: null }, progress: { status, completedItemCount: status === "COMPLETED" ? 5 : 0, totalItemCount: 5, percent: status === "COMPLETED" ? 100 : 0 } };
}
test("discover rejects started-topic payloads instead of filtering after pagination", async () => {
  await assert.rejects(apiWith({ items: [validCard("IN_PROGRESS")], total: 1, hasMore: false, nextCursor: null }).discover({}, signal), e => e.code === "CONTRACT_MISMATCH");
  assert.equal((await apiWith({ items: [validCard("NOT_STARTED")], total: 1, hasMore: false, nextCursor: null }).discover({}, signal)).total, 1);
});
test("mine rejects a wrong-tab payload instead of presenting a misleading count", async () => {
  const base = { total: 1, hasMore: false, nextCursor: null, counts: { inProgress: 0, completed: 1 } };
  await assert.rejects(apiWith({ ...base, items: [validCard("IN_PROGRESS")] }).mine({ status: "COMPLETED" }, signal), e => e.code === "CONTRACT_MISMATCH");
  assert.equal((await apiWith({ ...base, items: [validCard("COMPLETED")] }).mine({ status: "COMPLETED" }, signal)).items.length, 1);
});
