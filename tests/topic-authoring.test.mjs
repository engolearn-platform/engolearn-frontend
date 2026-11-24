import assert from "node:assert/strict";
import test from "node:test";
import {
  topicCreateBody,
  topicDraftFromResponse,
  topicUpdateBody,
} from "../src/features/topic/utils/topic-basic-info.adapter.ts";
import { mergeVocabularyEditorItem, toVocabularyAuthoringDraft } from "../src/features/topic/utils/topic-vocabulary-authoring.adapter.ts";

test("a minimal topic draft does not supply CEFR or category defaults", () => {
  const draft = topicDraftFromResponse({ id: "draft", titleEn: " Cafe ", titleVi: " Quán cà phê " });
  assert.equal(draft.cefr, "");
  assert.equal(draft.category, "");
  assert.deepEqual(topicCreateBody(draft), { titleEn: "Cafe", titleVi: "Quán cà phê" });
});

test("an update sends the revision, explicit clears and only changed metadata", () => {
  const original = topicDraftFromResponse({
    titleEn: "Cafe", titleVi: "Quán cà phê", category: "DINING", tags: ["menu"],
    durationMinutes: 5, coverUrl: "https://example.com/cover.webp",
  });
  assert.deepEqual(topicUpdateBody(original, { ...original, coverName: "", tags: [], duration: "9" }, 3), {
    revision: 3, coverUrl: null, tags: [],
  });
});

test("vocabulary edit preserves linked IDs, audio variants, and nested metadata", () => {
  const resource = {
    vocabId: "vocab-real", senseId: "sense-real",
    snapshot: { word: "drink", pos: "NOUN", sense: "beverage", describeVi: "đồ uống", phonetic: "/d/", audioUrl: "main.mp3", audioEnUrl: "en.mp3", audioUsUrl: "us.mp3" },
    samples: [{ textEn: "Order a drink", textVi: "Gọi đồ uống", audioUrl: "sample.wav", isManual: false }],
    collocations: [{ text: "soft drink", example: { en: "A soft drink", vi: "Nước ngọt" }, descriptionVi: "cụm giữ nguyên" }],
    quickCheck: null, orderIndex: 2, tips: "tip",
  };
  const draft = toVocabularyAuthoringDraft(resource);
  draft.word = "beverage";
  const merged = mergeVocabularyEditorItem(resource, draft, 0);
  assert.equal(merged.vocabId, "vocab-real");
  assert.equal(merged.senseId, "sense-real");
  assert.deepEqual(merged.snapshot, { ...resource.snapshot, word: "beverage" });
  assert.deepEqual(merged.samples, resource.samples);
  assert.deepEqual(merged.collocations, resource.collocations);
});
