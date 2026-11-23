import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchTopicItemById,
  fetchTopicItems,
  TopicApiError,
} from "../src/features/topic/services/topic-management.service.ts";

const success = data => Response.json({ data, timestamp: "2026-11-23T10:00:00Z" });

test("management item list is read from its topic scoped endpoint", async () => {
  const items = [{ id: "stable-item", topicId: "topic/1", title: "Arrival", order: 1, status: "PUBLISHED" }];
  const result = await fetchTopicItems("topic/1", undefined, async () => success(items));
  assert.deepEqual(result, items);
});

test("an empty management Item response stays empty and forwards cancellation", async () => {
  const controller = new AbortController();
  const result = await fetchTopicItems("topic-1", controller.signal, async (_url, init) => {
    assert.equal(init.method, "GET");
    assert.equal(init.signal, controller.signal);
    return success([]);
  });
  assert.deepEqual(result, []);
});

test("management resource detail preserves persisted context and quiz answers", async () => {
  const item = {
    id: "stable-item",
    topicId: "topic-1",
    versionId: "item-version-2",
    version: 2,
    context: { scenarioDescription: "At a cafe" },
    vocabularies: [{ snapshot: { word: "menu" } }],
    expressions: [],
    quizzes: [{ questions: [{ correct: "A", options: [{ label: "A", isCorrect: true }] }] }],
  };
  const result = await fetchTopicItemById("topic-1", "stable-item", undefined, async () => success(item));
  assert.deepEqual(result, item);
  assert.equal(result.quizzes[0].questions[0].options[0].isCorrect, true);
});

test("management read requests encode IDs and surface authorization and missing errors", async () => {
  let requestedUrl;
  let requestedMethod;
  await fetchTopicItemById("topic/one", "item/one", undefined, async (url, init) => {
    requestedUrl = url;
    requestedMethod = init.method;
    return success({ id: "item/one" });
  });
  assert.equal(requestedUrl, "/api/management/topics/topic%2Fone/items/item%2Fone");
  assert.equal(requestedMethod, "GET");

  for (const status of [401, 403, 404]) {
    await assert.rejects(
      fetchTopicItems("topic-1", undefined, async () => Response.json(
        { code: "READ_DENIED", message: "Access denied" },
        { status },
      )),
      error => error instanceof TopicApiError && error.status === status,
    );
  }
});

test("management read requests preserve network failures instead of returning fixture data", async () => {
  const networkError = new TypeError("Failed to fetch");
  await assert.rejects(
    fetchTopicItems("topic-1", undefined, async () => { throw networkError; }),
    error => error === networkError,
  );
});
