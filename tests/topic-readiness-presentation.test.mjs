import assert from "node:assert/strict";
import test from "node:test";
import { classifyReadinessViolation, readinessViolationMessage } from "../src/features/topic/utils/topic-readiness-presentation.ts";

const items = [
  { id: "hidden-id", title: "Hidden", order: 1, status: "HIDDEN" },
  { id: "item-1", title: "At a cafe", order: 2, status: "DRAFT" },
  { id: "item-2", title: "At the hotel", order: 3, status: "PUBLISHED" },
];

test("readiness violations use visible item identity and resource grouping", () => {
  const result = classifyReadinessViolation("items[item-2].quizzes[0].questions[0].audioUrl", items);
  assert.equal(result.item?.id, "item-2");
  assert.equal(result.group, "Bài học 3: At the hotel · Âm thanh");
  assert.equal(result.label, "Tệp âm thanh");
  assert.equal(result.action, "item-section");
  assert.equal(result.section, "quiz");
});

test("readiness metadata violations open Item metadata and count violations return to the Item list", () => {
  const metadata = classifyReadinessViolation("items[item-1].durationMinutes", items);
  assert.equal(metadata.item?.title, "At a cafe");
  assert.equal(metadata.label, "Thời lượng");
  assert.equal(metadata.action, "item-metadata");

  const count = classifyReadinessViolation("topic.itemCount", items);
  assert.equal(count.action, "item-list");
  assert.equal(count.label, "Số bài học");
});

test("unresolved indexed violation never exposes a raw path and returns to Item list", () => {
  const result = classifyReadinessViolation("items[99].context.prompt", items);
  assert.equal(result.item, undefined);
  assert.equal(result.action, "item-list");
  assert.equal(result.group, "Nội dung chủ đề");
});

test("readiness messages localize backend validation codes and give count guidance", () => {
  assert.match(readinessViolationMessage("topic.titleVi", "REQUIRED"), /bổ sung thông tin/);
  assert.match(readinessViolationMessage("topic.coverUrl", "INVALID_MEDIA"), /tệp đã tải lên/);
  assert.match(readinessViolationMessage("items[item-1].vocabularies", "COUNT_OUT_OF_RANGE"), /3 đến 5 từ vựng/);
  assert.match(readinessViolationMessage("items[item-1].vocabularies[0].examples", "COUNT_OUT_OF_RANGE"), /1 đến 3 ví dụ/);
  assert.match(readinessViolationMessage("items[item-1].expressionGroups[0].expressions", "COUNT_OUT_OF_RANGE"), /1 đến 3 cụm diễn đạt/);
  assert.match(readinessViolationMessage("items[item-1].quizzes.FILL_BLANK", "COUNT_OUT_OF_RANGE"), /3 đến 5 câu hỏi/);
  assert.match(readinessViolationMessage("items", "ITEM_COUNT"), /5 đến 20 bài học/);
  assert.match(readinessViolationMessage("items[item-1].quizzes[0].options", "CORRECT_ANSWER_COUNT"), /một đáp án đúng/);
  assert.doesNotMatch(readinessViolationMessage("topic.titleVi", "REQUIRED"), /required|field/i);
});
