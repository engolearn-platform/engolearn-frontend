import assert from "node:assert/strict";
import test from "node:test";
import { assertLesson, lessonUnits, canViewPosition, viewingPosition, samePosition } from "../src/features/topic/utils/topic-lesson.ts";
const content = {
  topicItemId: "item", topicItemVersionId: "v1", version: 1, title: "Lesson",
  context: { scenarioDescription: "Context", dialogue: [] },
  vocabularies: [{ vocabId: "b", word: "b", meaningVi: "b", orderIndex: 1, examples: [], collocations: [] }, { vocabId: "a", word: "a", meaningVi: "a", orderIndex: 1, examples: [], collocations: [] }],
  expressions: [{ groupId: "g1", purposes: [{ purposeId: "b", purposeVi: "B", orderIndex: 2, examples: [] }, { purposeId: "a", purposeVi: "A", orderIndex: 1, examples: [] }] }, { groupId: "g2", purposes: [{ purposeId: "c", purposeVi: "C", orderIndex: 0, examples: [] }] }],
};
const attempt = {
  attemptId: "attempt", topicId: "topic", topicItemId: "item", topicItemVersionId: "v1", version: 1, revision: 2,
  status: "IN_PROGRESS", position: { stage: "VOCAB", itemIndex: 1 },
  progress: { percent: 25, totalQuizCount: 5 },
};
test("content order is stable and purpose indices flatten within the frozen group order", () => {
  const units = lessonUnits(content);
  assert.deepEqual(units.vocabulary.map(v => v.vocabId), ["a", "b"]);
  assert.deepEqual(units.purposes.map(p => p.purposeId), ["a", "b", "c"]);
  assert.equal(content.vocabularies[0].vocabId, "b");
});
test("navigation permits past/frontier but locks future, absent and invalid units", () => {
  for (const position of [{ stage: "CONTEXT", itemIndex: 0 }, { stage: "VOCAB", itemIndex: 0 }, attempt.position]) assert.equal(canViewPosition(position, attempt, content), true);
  for (const position of [{ stage: "EXPRESSIONS", itemIndex: 0 }, { stage: "VOCAB", itemIndex: 2 }, { stage: "FILL_BLANK", itemIndex: 0 }, { stage: "CONTEXT", itemIndex: -1 }]) assert.equal(canViewPosition(position, attempt, content), false);
  assert.equal(canViewPosition({ stage: "EXPRESSIONS", itemIndex: 2 }, { ...attempt, status: "COMPLETED", position: null }, content), true);
});
test("view query never moves persisted frontier and invalid deep links fall back to it", () => {
  assert.deepEqual(viewingPosition(new URLSearchParams("stage=CONTEXT&index=0"), attempt, content), { stage: "CONTEXT", itemIndex: 0 });
  for (const query of ["", "stage=VOCAB&index=", "stage=VOCAB&index=1.5", "stage=EXPRESSIONS&index=0", "stage=BAD&index=0"]) assert.deepEqual(viewingPosition(new URLSearchParams(query), attempt, content), attempt.position);
  assert.deepEqual(attempt.position, { stage: "VOCAB", itemIndex: 1 });
  assert.equal(samePosition(attempt.position, { stage: "VOCAB", itemIndex: 0 }), false);
});
test("lesson snapshot rejects wrong ownership, version and impossible frontier", () => {
  assert.doesNotThrow(() => assertLesson(attempt, content, "topic", "attempt"));
  for (const changed of [{ ...attempt, topicId: "other" }, { ...attempt, topicItemVersionId: "v2" }, { ...attempt, position: { stage: "VOCAB", itemIndex: 99 } }, { ...attempt, status: "COMPLETED" }, { ...attempt, progress: { percent: NaN } }]) {
    assert.throws(() => assertLesson(changed, content, "topic", "attempt"), { code: "CONTRACT_MISMATCH" });
  }
});
