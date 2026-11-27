import assert from "node:assert/strict";
import test from "node:test";
import {
  clearResourceSelection,
  filterSpeakingResourceGroups,
  isSpeakingResourceGroupExpanded,
  removeResourceSelection,
  resourceGroupSelection,
  toggleResourceGroupSelection,
  toggleResourceSelection,
} from "../src/features/topic/utils/speaking-resource-selection.ts";

const groups = [
  { itemId: "item-a", itemTitle: "Greetings", resources: [{ textEn: "hello" }, { textEn: "good morning" }] },
  { itemId: "item-b", itemTitle: "Personal details", resources: [{ textEn: "first name" }, { textEn: "age" }] },
];

test("Topic group selection moves unchecked, mixed, and checked independently", () => {
  assert.equal(resourceGroupSelection(["a-1", "a-2"], []), "unchecked");
  const partial = toggleResourceSelection([], "a-1", true);
  assert.equal(resourceGroupSelection(["a-1", "a-2"], partial), "mixed");
  const all = toggleResourceGroupSelection(partial, ["a-1", "a-2"]);
  assert.deepEqual(all, ["a-1", "a-2"]);
  assert.equal(resourceGroupSelection(["a-1", "a-2"], all), "checked");
  assert.deepEqual(toggleResourceGroupSelection(all, ["a-1", "a-2"]), []);

  const bothGroups = toggleResourceGroupSelection(all, ["b-1", "b-2"]);
  assert.deepEqual(bothGroups, ["a-1", "a-2", "b-1", "b-2"]);
  assert.deepEqual(toggleResourceSelection(bothGroups, "a-1", false), ["a-2", "b-1", "b-2"]);
  assert.equal(resourceGroupSelection(["b-1", "b-2"], ["a-1", "b-1", "b-2"]), "checked");
});

test("explicit stale removal and clear selection preserve deliberate user control", () => {
  const refs = ["live-a", "stale-old", "live-b"];
  assert.deepEqual(removeResourceSelection(refs, "stale-old"), ["live-a", "live-b"]);
  assert.deepEqual(clearResourceSelection(), []);
  assert.deepEqual(refs, ["live-a", "stale-old", "live-b"], "selection helpers do not mutate stored refs");
});

test("search reveals whole matching groups and disclosure changes do not change selected refs", () => {
  const selected = ["a-1", "b-2"];
  const result = filterSpeakingResourceGroups(groups, "hello");
  assert.equal(result.length, 1);
  assert.equal(result[0].itemId, "item-a");
  assert.equal(result[0].resources.length, 2, "a resource match reveals the full group");
  assert.equal(filterSpeakingResourceGroups(groups, "personal")[0].itemId, "item-b");
  assert.equal(isSpeakingResourceGroupExpanded("item-a", new Set(["item-a"])), true);
  assert.equal(isSpeakingResourceGroupExpanded("item-b", new Set(["item-b"])), true);
  assert.equal(isSpeakingResourceGroupExpanded("item-a", new Set()), false);
  assert.deepEqual(selected, ["a-1", "b-2"], "search and expand/collapse are presentation-only");
});
