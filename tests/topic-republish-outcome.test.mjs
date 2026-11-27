import assert from "node:assert/strict";
import test from "node:test";
import { topicRepublishOutcome } from "../src/features/topic/utils/topic-republish-outcome.ts";
import { topicStatusLabel } from "../src/features/topic/utils/topic-status-presentation.ts";

test("republishing an unchanged unpublished Topic reports the persisted release as reused", () => {
  assert.equal(topicRepublishOutcome("unpublished", "release-4", "release-4"), "reused-release");
});

test("republishing changed content reports a successor release", () => {
  assert.equal(topicRepublishOutcome("unpublished", "release-4", "release-5"), "new-release");
});

test("first publication remains distinct from republishing", () => {
  assert.equal(topicRepublishOutcome("draft", null, "release-1"), "published");
});

test("Topic status labels represent each management state", () => {
  assert.equal(topicStatusLabel("draft"), "Bản nháp");
  assert.equal(topicStatusLabel("published"), "Đã xuất bản");
  assert.equal(topicStatusLabel("unpublished"), "Đã gỡ xuất bản");
});
