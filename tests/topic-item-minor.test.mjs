import assert from "node:assert/strict";
import test from "node:test";
import { applyItemMinor, TopicApiError } from "../src/features/topic/services/topic-management.service.ts";
import { composeMinorChange } from "../src/features/topic/utils/topic-minor.adapter.ts";
import { mergeVocabularyEditorItem, toVocabularyAuthoringDraft } from "../src/features/topic/utils/topic-vocabulary-authoring.adapter.ts";

const item = (overrides = {}) => ({
  id: "item/one", topicId: "topic/one", status: "PUBLISHED", versionId: "item-version-4",
  context: null, vocabularies: [], expressions: [], quizzes: [], ...overrides,
});

test("MINOR client sends the current revision, published target and one typed section", async () => {
  const context = { prompt: "prompt", scenarioDescription: "scene", dialogue: [{ speaker: "A", textEn: "hello", textVi: "xin chào", audioUrl: null }], durationSec: 20, tips: null };
  let request;
  const response = await applyItemMinor("topic/one", "item/one", 8, "item-version-4", { context }, async (url, init) => {
    request = { url, init };
    return Response.json({ data: { revision: 9, item: item({ context }) }, timestamp: "2026-11-26T00:00:00Z" });
  });
  assert.equal(request.url, "/api/management/topics/topic%2Fone/items/item%2Fone/minor");
  assert.equal(request.init.method, "PATCH");
  assert.deepEqual(JSON.parse(request.init.body), { revision: 8, itemVersionId: "item-version-4", context });
  assert.equal(response.revision, 9);
});

test("MINOR client retains server unsafe-change errors for localized recovery", async () => {
  await assert.rejects(applyItemMinor("topic", "item", 2, "version-2", { quizzes: [] }, async () => Response.json(
    { code: "MINOR_REQUIRES_MAJOR", message: "unsafe" }, { status: 400 },
  )), error => error instanceof TopicApiError && error.code === "MINOR_REQUIRES_MAJOR" && error.status === 400);
});

test("quiz audio and combined explanation changes preserve legacy answers and feedback", () => {
  const original = item({ quizzes: [{
    quizId: "quiz-1", quizType: "SITUATIONAL_CHOICE", title: "Cafe", instructions: "Choose", orderIndex: 0,
    questions: [{ prompt: "Which?", audioUrl: null, options: [{ label: "A", textEn: "Tea", isCorrect: true }, { label: "B", textEn: "Coffee", isCorrect: false }], correct: "A", explanationOk: "legacy ok", explanationNg: "legacy ng", explanation: "old explanation", sentence: null, quizData: { order: ["A", "B"] }, answerData: { answer: "A" }, tips: null, extraLegacy: { keep: true } }],
  }] });
  const edited = structuredClone(original.quizzes);
  edited[0].questions[0].audioUrl = "managed://audio/new";
  edited[0].questions[0].explanation = "Clear explanation";
  const result = composeMinorChange("quiz", original, edited);
  assert.ok("change" in result);
  const saved = result.change.quizzes[0].questions[0];
  assert.equal(saved.audioUrl, "managed://audio/new");
  assert.equal(saved.explanation, "Clear explanation");
  assert.equal(saved.explanationOk, "legacy ok");
  assert.equal(saved.explanationNg, "legacy ng");
  assert.deepEqual(saved.options, original.quizzes[0].questions[0].options);
  assert.deepEqual(saved.answerData, original.quizzes[0].questions[0].answerData);
  assert.deepEqual(saved.extraLegacy, { keep: true });
  assert.equal(original.quizzes[0].questions[0].audioUrl, null);
});

test("vocabulary MINOR copies safe leaves from an exact clone and rejects reorder", () => {
  const original = item({ vocabularies: [
    { vocabId: "v1", senseId: "s1", snapshot: { word: "menu", pos: "NOUN", sense: "list", describeVi: "thực đơn", phonetic: null, audioUrl: null, audioEnUrl: null, audioUsUrl: null, legacy: "kept" }, samples: [{ textEn: "The menu is here", textVi: "Thực đơn đây", audioUrl: null, isManual: false }], collocations: [], quickCheck: { explanation: "kept" }, orderIndex: 0, tips: null },
    { vocabId: "v2", senseId: "s2", snapshot: { word: "bill", pos: "NOUN", sense: null, describeVi: "hóa đơn", phonetic: null, audioUrl: null, audioEnUrl: null, audioUsUrl: null }, samples: [], collocations: [], quickCheck: null, orderIndex: 1, tips: null },
  ] });
  const edited = structuredClone(original.vocabularies);
  edited[0].snapshot.describeVi = "thực đơn của quán";
  edited[0].samples[0].audioUrl = "managed://audio/sample";
  const result = composeMinorChange("vocabulary", original, edited);
  assert.ok("change" in result);
  assert.equal(result.change.vocabularies[0].snapshot.describeVi, "thực đơn của quán");
  assert.equal(result.change.vocabularies[0].samples[0].audioUrl, "managed://audio/sample");
  assert.equal(result.change.vocabularies[0].snapshot.legacy, "kept");
  assert.deepEqual(result.change.vocabularies[0].quickCheck, original.vocabularies[0].quickCheck);
  const reordered = [...edited].reverse();
  const rejected = composeMinorChange("vocabulary", original, reordered);
  assert.ok("error" in rejected);
  assert.equal(original.vocabularies[0].snapshot.describeVi, "thực đơn");
});

test("vocabulary authoring adapter can make a safe edit without normalizing untouched fields", () => {
  const original = item({ vocabularies: [{ vocabId: "v1", senseId: "s1", snapshot: { word: "menu", pos: "NOUN", sense: "list", describeVi: "thực đơn", phonetic: null, audioUrl: null, audioEnUrl: null, audioUsUrl: null }, samples: [{ textEn: "The menu is here", textVi: null, audioUrl: null, isManual: true }], collocations: [], quickCheck: null, orderIndex: 0, tips: null }] });
  const draft = toVocabularyAuthoringDraft(original.vocabularies[0]);
  draft.meaningVi = "thực đơn của quán";
  const edited = [mergeVocabularyEditorItem(original.vocabularies[0], draft, 0)];
  const result = composeMinorChange("vocabulary", original, edited);
  assert.ok("change" in result, "safe adapter edit should not be rejected as structural");
  assert.equal(result.change.vocabularies[0].snapshot.describeVi, "thực đơn của quán");
  assert.equal(result.change.vocabularies[0].samples[0].textVi, null);
  assert.equal(result.change.vocabularies[0].samples[0].isManual, true);
});

test("expression MINOR accepts Vietnamese purpose text while preserving examples identity", () => {
  const original = item({ expressions: [{ tips: "tip", purposes: [{ purposeEn: "ask", purposeVi: "hỏi", orderIndex: 0, groupType: "BASIC", examples: [{ type: "BASIC_SUGGESTION", label: "POLITE", textEn: "Could I see the menu?", textVi: "Tôi xem thực đơn được không?", usageNote: null, audioUrl: null, linkedVocabIds: ["v1"] }] }] }] });
  const edited = structuredClone(original.expressions);
  edited[0].purposes[0].purposeVi = "xin hỏi";
  edited[0].purposes[0].examples[0].usageNote = "Dùng lời nói lịch sự";
  const result = composeMinorChange("expressions", original, edited);
  assert.ok("change" in result);
  assert.equal(result.change.expressions[0].purposes[0].purposeVi, "xin hỏi");
  assert.equal(result.change.expressions[0].purposes[0].examples[0].usageNote, "Dùng lời nói lịch sự");
  assert.deepEqual(result.change.expressions[0].purposes[0].examples[0].linkedVocabIds, ["v1"]);
});
