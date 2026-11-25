import assert from "node:assert/strict";
import test from "node:test";
import { isSpeakingProfileRevisionConflict, validateSpeakingProfile } from "../src/features/topic/utils/speaking-profile.validation.ts";

const blank = {
  enabled: false, level: null, description: "", aiRole: "", learnerRole: "", suggestedTopics: [],
  selectedResourceIds: [], fallbackReply: "", fallbackHint: null,
};

test("disabled and absent profiles do not block publication validation", () => {
  assert.deepEqual(validateSpeakingProfile(blank), []);
});

test("enabled profiles require only the frozen profile fields and a complete optional hint", () => {
  const problems = validateSpeakingProfile({ ...blank, enabled: true, fallbackHint: { exampleEn: "Hi", explanationVi: "" } });
  assert.equal(problems.length, 6);
  const valid = { ...blank, enabled: true, level: "A2", description: "Order a drink.", aiRole: "Barista",
    learnerRole: "Customer", fallbackReply: "What would you like?", fallbackHint: { exampleEn: "Orange juice, please.", explanationVi: "Bạn có thể gọi nước cam." } };
  assert.deepEqual(validateSpeakingProfile(valid), []);
});

test("stale profile revisions are detected for reload before another write", () => {
  assert.equal(isSpeakingProfileRevisionConflict({ status: 409 }), true);
  assert.equal(isSpeakingProfileRevisionConflict({ status: 403 }), false);
  assert.equal(isSpeakingProfileRevisionConflict(null), false);
});
