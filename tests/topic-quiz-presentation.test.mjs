import assert from "node:assert/strict";
import test from "node:test";
import { toQuizPresentations } from "../src/features/topic/utils/topic-quiz-presentation.ts";

const option = (label, textEn, isCorrect = false) => ({ label, textEn, isCorrect });
const question = (overrides = {}) => ({
  prompt: null,
  audioUrl: null,
  options: [],
  correct: null,
  explanationOk: null,
  explanationNg: null,
  sentence: null,
  quizData: null,
  answerData: null,
  explanation: null,
  tips: null,
  ...overrides,
});
const module = (quizType, questions, overrides = {}) => ({
  quizId: null,
  quizType,
  title: "Module",
  instructions: null,
  orderIndex: 0,
  questions,
  ...overrides,
});

test("keeps module and question API order, counts question rows, and presents every row once", () => {
  const raw = [
    module("FILL_BLANK", [question({ sentence: { textEn: "We order tea.", meaningVi: "Chúng tôi gọi trà.", audioUrl: null }, options: [option("A", "tea", true), option("B", "coffee")] })]),
    module("SITUATIONAL_CHOICE", [question({ prompt: "What do you say?", options: [option("A", "Could I see the menu?", true), option("B", "Good night.")] }), question({ prompt: "Second question", options: [] })], { orderIndex: 0 }),
  ];
  const result = toQuizPresentations(raw);

  assert.equal(result.totalQuestions, 3);
  assert.deepEqual(result.modules.map(row => row.quizType), ["FILL_BLANK", "SITUATIONAL_CHOICE"]);
  assert.deepEqual(result.modules.map(row => row.questions.length), [1, 2]);
  assert.equal(result.modules[0].questions[0].kind, "FILL_BLANK");
  assert.equal(result.modules[1].questions[0].kind, "SITUATIONAL_CHOICE");
  assert.equal(result.modules[1].questions[1].correctness.status, "missing");
});

test("keeps legacy incomplete rows and unknown module types visible without losing raw data", () => {
  const unsupported = module("WORD_ORDER", [question({ quizData: { words: ["we", "go"] } })]);
  const incomplete = module("FILL_BLANK", [question({ sentence: { textEn: "A legacy sentence.", meaningVi: null, audioUrl: null }, answerData: { correct_answer: "legacy" } })]);
  const raw = [unsupported, incomplete];
  const result = toQuizPresentations(raw);

  assert.equal(result.totalQuestions, 2);
  assert.equal(result.modules[0].kind, "unsupported");
  assert.equal(result.modules[0].questions[0].details.quizData.words[1], "go");
  assert.equal(result.modules[1].questions[0].correctness.status, "conflict");
  assert.deepEqual(raw, [unsupported, incomplete]);
});

test("does not infer a correct answer from conflicting flags or ambiguous answer sources", () => {
  const conflictingFlags = question({
    prompt: "Choose",
    options: [option("A", "Yes", true), option("B", "No", true)],
    correct: "A",
  });
  const conflictingSources = question({
    sentence: { textEn: "We choose tea.", meaningVi: null, audioUrl: null },
    options: [option("A", "tea"), option("B", "coffee")],
    answerData: { correct_option: "coffee" },
  });
  const result = toQuizPresentations([module("SITUATIONAL_CHOICE", [conflictingFlags, conflictingSources])]);

  assert.equal(result.modules[0].questions[0].correctness.status, "conflict");
  assert.equal(result.modules[0].questions[0].correctness.selectedOptionIndex, null);
  assert.equal(result.modules[0].questions[1].correctness.status, "conflict");
  assert.equal(result.modules[0].questions[1].correctness.selectedOptionIndex, null);
});

test("resolves documented answer sources only when they identify one stored option", () => {
  const raw = [module("SITUATIONAL_CHOICE", [
    question({ prompt: "Choose", options: [{ label: "A", textEn: "Yes", isCorrect: null }, { label: "B", textEn: "No", isCorrect: null }], correct: "B" }),
    question({ prompt: "Choose", options: [{ label: "A", textEn: "Yes", isCorrect: null }, { label: "B", textEn: "No", isCorrect: null }], answerData: { correct_option: "B" } }),
  ])];
  const result = toQuizPresentations(raw);

  assert.equal(result.modules[0].questions[0].correctness.status, "resolved");
  assert.equal(result.modules[0].questions[0].correctness.selectedOptionIndex, 1);
  assert.equal(result.modules[0].questions[1].correctness.status, "resolved");
  assert.equal(result.modules[0].questions[1].correctness.selectedOptionIndex, 1);
});

test("supports observed imported fill-blank fields without assigning labels by bank position", () => {
  const imported = question({
    prompt: "Fill this in",
    options: [],
    quizData: { sentence_with_blank: "We ___ the ticket.", word_bank: ["reserve", "book"], scenario_vi: "Đặt vé trực tuyến" },
    answerData: { answer: "book" },
    sentence: { textEn: "We book the ticket.", meaningVi: "Chúng tôi đặt vé.", audioUrl: null, audioUrlSlow: "topic-media:t:m" },
  });
  const result = toQuizPresentations([module("FILL_BLANK", [imported])]);
  const row = result.modules[0].questions[0];

  assert.equal(row.sentenceWithBlank, "We ___ the ticket.");
  assert.deepEqual(row.wordBank, ["reserve", "book"]);
  assert.equal(row.correctness.status, "resolved");
  assert.equal(row.correctness.selectedOptionIndex, null);
  assert.equal(row.correctness.selectedAnswerText, "book");
  assert.equal(row.scenarioVi, "Đặt vé trực tuyến");
  assert.equal(row.audioUrlSlow, "topic-media:t:m");
  assert.equal(JSON.stringify(row.details).includes("topic-media:"), false);

  const derived = question({ ...imported, quizData: { word_bank: ["reserve", "book"] } });
  assert.equal(toQuizPresentations([module("FILL_BLANK", [derived])]).modules[0].questions[0].sentenceWithBlank,
    "We ___ the ticket.");
});

test("canonical option order wins over stale legacy word banks and tied module IDs stay distinct", () => {
  const raw = [
    module("FILL_BLANK", [question({
      sentence: { textEn: "They reserve the room.", meaningVi: null, audioUrl: null },
      options: [option("A", "reserve", true), option("B", "book")],
      quizData: { word_bank: ["wrong", "legacy"] },
    })], { quizId: "same-id" }),
    module("SITUATIONAL_CHOICE", [], { quizId: "same-id" }),
  ];
  const result = toQuizPresentations(raw);

  assert.notEqual(result.modules[0].id, result.modules[1].id);
  assert.deepEqual(result.modules[0].questions[0].wordBank, ["reserve", "book"]);
  assert.equal(result.modules[0].questions[0].sentenceWithBlank, "They ___ the room.");
});

test("does not mark a repeated legacy bank token as a unique correct answer", () => {
  const raw = [module("FILL_BLANK", [question({
    options: [],
    quizData: { word_bank: ["book", "book"] },
    answerData: { answer: "book" },
  })])];
  const result = toQuizPresentations(raw);

  assert.equal(result.modules[0].questions[0].correctness.status, "conflict");
  assert.equal(result.modules[0].questions[0].correctness.selectedAnswerText, null);
});
