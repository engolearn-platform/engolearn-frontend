import assert from "node:assert/strict";
import test from "node:test";
import { partOfSpeechLabel, toVocabularyPresentation, vocabularyCollocationLayout } from "../src/features/topic/utils/topic-vocabulary-presentation.ts";

test("simple-only collocations select visible chips and empty collections stay omitted", () => {
  const simple = toVocabularyPresentation({
    vocabId: null, senseId: null, snapshot: { word: "leave home" }, samples: [],
    collocations: [
      { text: "at sunrise", example: null, descriptionVi: null },
      { text: "before work", example: null, descriptionVi: null },
    ], quickCheck: null, orderIndex: 1, tips: null,
  }).collocations;

  assert.deepEqual(simple.map((entry) => entry.text), ["at sunrise", "before work"]);
  assert.equal(vocabularyCollocationLayout(simple), "chips");
  assert.equal(vocabularyCollocationLayout([]), "none");
  assert.equal(vocabularyCollocationLayout([
    ...simple,
    { text: "get ready", exampleEn: "I get ready before work.", exampleVi: "Tôi chuẩn bị trước khi làm.", descriptionVi: "chuẩn bị" },
  ]), "details");
});

test("vocabulary presentation keeps pronunciation, example media, collocation details, and references", () => {
  const result = toVocabularyPresentation({
    vocabId: "linked-word", senseId: "linked-sense",
    snapshot: { word: "drink", pos: "NOUN", sense: "beverage", describeVi: "đồ uống", phonetic: "/drɪŋk/", audioUrl: "main.mp3", audioEnUrl: "en.mp3", audioUsUrl: null },
    samples: [{ textEn: "Order a drink", textVi: "Gọi đồ uống", audioUrl: "sample.mp3", isManual: false }],
    collocations: [{ text: "soft drink", example: { en: "A soft drink", vi: "Nước ngọt" }, descriptionVi: "nước ngọt" }],
    quickCheck: null, orderIndex: 2, tips: "Dùng khi gọi món",
  });
  assert.deepEqual(result.pronunciations, [
    { label: "Âm thanh", url: "main.mp3" }, { label: "Giọng Anh", url: "en.mp3" },
  ]);
  assert.equal(result.examples[0].audioUrl, "sample.mp3");
  assert.equal(result.collocations[0].descriptionVi, "nước ngọt");
  assert.deepEqual(result.references, { vocabId: "linked-word", senseId: "linked-sense" });
});

test("quick check correctness is shown only for explicit, unambiguous stored answer", () => {
  const base = { vocabId: null, senseId: null, snapshot: { word: "drink" }, samples: [], collocations: [], orderIndex: null, tips: null };
  const supported = toVocabularyPresentation({ ...base, quickCheck: {
    sentence: { textEn: "Choose the drink", meaningVi: "Chọn đồ uống", audioUrl: "quick.mp3", audioUrlSlow: "quick-slow.mp3", source: "dictionary", externalId: "sentence-1" },
    quizData: { question: "Which is a drink?", options: ["water", "plate"] }, answerData: { correctAnswer: "water" }, explanation: "Water is a drink.",
  } }).quickCheck;
  assert.deepEqual(supported, { question: "Which is a drink?", options: ["water", "plate"], correctAnswer: "water", answerInconsistent: false, explanation: "Water is a drink.", sentence: "Choose the drink", meaningVi: "Chọn đồ uống", audioUrl: "quick.mp3", audioUrlSlow: "quick-slow.mp3", source: "dictionary", externalId: "sentence-1" });

  const mongoStored = toVocabularyPresentation({ ...base, quickCheck: {
    sentence: null, quizData: { question: "Pick one", options: ["a", "b"] }, answerData: { correct_answer: "b" }, explanation: null,
  } }).quickCheck;
  assert.equal(mongoStored?.correctAnswer, "b");
  assert.equal(mongoStored?.answerInconsistent, false);

  const conflict = toVocabularyPresentation({ ...base, quickCheck: {
    sentence: null,
    quizData: { question: "Pick one", options: ["water", "plate"] },
    answerData: { correctAnswer: "water", correct_answer: "plate" },
    explanation: null,
  } }).quickCheck;
  assert.equal(conflict?.correctAnswer, null);
  assert.equal(conflict?.answerInconsistent, true);

  const topLevelConflict = toVocabularyPresentation({ ...base, quickCheck: {
    correctAnswer: "water",
    sentence: null,
    quizData: { question: "Pick one", options: ["water", "plate"] },
    answerData: { correct_answer: "plate" },
    explanation: null,
  } }).quickCheck;
  assert.equal(topLevelConflict?.correctAnswer, null);
  assert.equal(topLevelConflict?.answerInconsistent, true);

  const ambiguous = toVocabularyPresentation({ ...base, quickCheck: {
    sentence: null, quizData: { question: "Pick one", options: ["a", "b"] }, answerData: {}, explanation: null,
  } }).quickCheck;
  assert.equal(ambiguous?.correctAnswer, null);

  const unsupported = toVocabularyPresentation({ ...base, quickCheck: {
    sentence: null, quizData: { legacyPrompt: "A legacy prompt" }, answerData: { legacyAnswer: "a" }, explanation: null,
  } });
  assert.equal(unsupported.hasUnsupportedQuickCheck, true);
});

test("presentation hides duplicate sense, identifies unresolved links, missing pronunciation and known provenance", () => {
  const base = { vocabId: "dictionary-id", senseId: null, snapshot: { word: "drink", pos: "phrase", describeVi: "Đồ uống", sense: " đồ uống " }, samples: [
    { textEn: "One", textVi: null, audioUrl: null, isManual: true },
    { textEn: "Two", textVi: null, audioUrl: null, isManual: null },
  ], collocations: [], quickCheck: null, orderIndex: 1, tips: null };
  const result = toVocabularyPresentation(base);
  assert.equal(result.showSense, false);
  assert.equal(result.hasUnresolvedReference, true);
  assert.equal(result.hasMissingPronunciation, true);
  assert.deepEqual(result.sampleProvenance, [{ sampleIndex: 1, label: "Thủ công" }]);
  assert.equal(partOfSpeechLabel("phrase"), "Cụm từ");
  assert.equal(partOfSpeechLabel("verb phrase"), "Cụm động từ");
  assert.equal(partOfSpeechLabel("PHRASE"), "Cụm từ");
});
