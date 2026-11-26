import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublishedTopicItemById, openItemWorkingDraft, publishTopic, TopicApiError } from "../src/features/topic/services/topic-management.service.ts";
import { topicPublishRecoveryState } from "../src/features/topic/utils/topic-publish-recovery.ts";

const result = {
  topicId: "topic/one", revision: 12, topicVersionId: "topic-version-1", version: 1,
  items: [{ topicItemId: "item-1", itemVersionId: "item-version-1", version: 1, order: 1, title: "At a cafe", durationMinutes: 5 }],
  itemCount: 1, durationMinutes: 5, publishedAt: "2026-11-26T03:00:00Z",
};

test("initial publish sends the latest revision and returns the committed server summary", async () => {
  let request;
  const published = await publishTopic("topic/one", 11, async (url, init) => {
    request = { url, init };
    return Response.json({ data: result, timestamp: result.publishedAt });
  });
  assert.equal(request.url, "/api/management/topics/topic%2Fone/publish");
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(request.init.body), { revision: 11 });
  assert.deepEqual(published, result);
});

test("publish validation ProblemDetail preserves actionable violations", async () => {
  await assert.rejects(publishTopic("topic-1", 3, async () => Response.json({
    type: "about:blank", title: "Unprocessable Entity", status: 422,
    detail: "Saved content is incomplete", code: "PUBLISH_VALIDATION_FAILED",
    violations: [{ path: "items[item-id].vocabularies", code: "AUDIO_REQUIRED", message: "Add audio" }],
  }, { status: 422 })), error => {
    assert.ok(error instanceof TopicApiError);
    assert.equal(error.status, 422);
    assert.equal(error.code, "PUBLISH_VALIDATION_FAILED");
    assert.deepEqual(error.violations, [{ path: "items[item-id].vocabularies", code: "AUDIO_REQUIRED", message: "Add audio" }]);
    return true;
  });
});

test("publish conflict is surfaced without retrying", async () => {
  let calls = 0;
  await assert.rejects(publishTopic("topic-1", 4, async () => {
    calls++;
    return Response.json({ code: "CONFLICT", message: "Revision changed" }, { status: 409 });
  }), error => error instanceof TopicApiError && error.status === 409 && error.code === "CONFLICT");
  assert.equal(calls, 1);
});

test("published detail explicitly selects the current release", async () => {
  let request;
  const detail = { id: "item-1", status: "PUBLISHED", versionId: "version-7" };
  const item = await fetchPublishedTopicItemById("topic/one", "item-1", undefined, async (url, init) => {
    request = { url, init };
    return Response.json({ data: detail, timestamp: result.publishedAt });
  });
  assert.equal(request.url, "/api/management/topics/topic%2Fone/items/item-1?view=published");
  assert.equal(request.init.method, "GET");
  assert.deepEqual(item, detail);
});

test("opening a MAJOR draft sends the exact latest revision and released base", async () => {
  let request;
  const opened = { revision: 13, item: { id: "item-1", status: "DRAFT", previousItemVersionId: "version-7" } };
  const response = await openItemWorkingDraft("topic/one", "item-1", 12, "version-7", async (url, init) => {
    request = { url, init };
    return Response.json({ data: opened, timestamp: result.publishedAt });
  });
  assert.equal(request.url, "/api/management/topics/topic%2Fone/items/item-1/working-draft");
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(request.init.body), { revision: 12, baseItemVersionId: "version-7" });
  assert.deepEqual(response, opened);
});

test("no-op batch response remains a distinct API error", async () => {
  await assert.rejects(publishTopic("topic-1", 4, async () => Response.json({
    code: "NO_EFFECTIVE_CHANGES", message: "No changes to publish",
  }, { status: 409 })), error => error instanceof TopicApiError && error.status === 409 && error.code === "NO_EFFECTIVE_CHANGES");
});

test("ambiguous publish recovery distinguishes the same release from a newly advanced release", () => {
  assert.equal(topicPublishRecoveryState("release-4", "release-4"), "unchanged");
  assert.equal(topicPublishRecoveryState("release-4", "release-5"), "advanced");
  assert.equal(topicPublishRecoveryState(null, "release-1"), "advanced");
  assert.equal(topicPublishRecoveryState(null, null), "unchanged");
});
