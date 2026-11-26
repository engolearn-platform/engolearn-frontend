import assert from "node:assert/strict";
import test from "node:test";
import {
  expressionGroupTypeLabel,
  expressionLabel,
  expressionTypeLabel,
  expressionVocabularyLinks,
  expressionSentenceCount,
} from "../src/features/topic/utils/topic-expression-presentation.ts";

test("expression classifications keep group type, sentence label, and sentence type distinct", () => {
  assert.equal(expressionGroupTypeLabel("BASIC"), "Cơ bản");
  assert.equal(expressionGroupTypeLabel("PLACEHOLDER"), "Mẫu thế chỗ");
  assert.equal(expressionLabel("SLOT_HINT"), "Gợi ý mẫu thế chỗ");
  assert.equal(expressionTypeLabel("SLOT_PATTERN"), "Mẫu thế chỗ");
  assert.equal(expressionGroupTypeLabel("LEGACY_GROUP"), null);
  assert.equal(expressionLabel("LEGACY_LABEL"), null);
  assert.equal(expressionTypeLabel("LEGACY_TYPE"), null);
  assert.equal(expressionGroupTypeLabel("toString"), null);
  assert.equal(expressionLabel("constructor"), null);
  assert.equal(expressionTypeLabel("__proto__"), null);
});

test("vocabulary links preserve order and duplicates while exposing unresolved IDs separately", () => {
  const links = expressionVocabularyLinks(
    ["vocab-b", "missing", "vocab-a", "vocab-b", "empty-word"],
    new Map([
      ["vocab-a", "ask"],
      ["vocab-b", "get up"],
      ["empty-word", ""],
    ]),
  );

  assert.deepEqual(links.resolved, [
    { id: "vocab-b", word: "get up" },
    { id: "vocab-a", word: "ask" },
    { id: "vocab-b", word: "get up" },
  ]);
  assert.deepEqual(links.unresolvedIds, ["missing", "empty-word"]);
});

test("sentence counts include examples across every block and purpose", () => {
  assert.equal(expressionSentenceCount([
    { tips: "first block", purposes: [
      { purposeEn: "same", purposeVi: "giống", groupType: "BASIC", orderIndex: 8, examples: [
        { type: "BASIC_SUGGESTION", label: "COMMON", textEn: "One", textVi: null, usageNote: null, audioUrl: null, linkedVocabIds: [] },
        { type: "POLITE_INQUIRY", label: "POLITE", textEn: "Two", textVi: null, usageNote: null, audioUrl: null, linkedVocabIds: [] },
      ] },
      { purposeEn: "second", purposeVi: "thứ hai", groupType: "COMMON", orderIndex: 2, examples: [] },
    ] },
    { tips: null, purposes: [
      { purposeEn: "same", purposeVi: "giống", groupType: "PLACEHOLDER", orderIndex: 0, examples: [
        { type: "SLOT_PATTERN", label: "SLOT_HINT", textEn: "Three [slot]", textVi: null, usageNote: null, audioUrl: null, linkedVocabIds: [] },
      ] },
    ] },
  ]), 3);
});
