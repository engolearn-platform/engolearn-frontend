import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readView = await readFile(new URL("../src/features/topic/views/management/TopicManagementReadView.tsx", import.meta.url), "utf8");
const presentation = await readFile(new URL("../src/features/topic/components/management/read/TopicContextResourceView.tsx", import.meta.url), "utf8");
const contextReadUtils = await readFile(new URL("../src/features/topic/utils/topic-context-presentation.ts", import.meta.url), "utf8");

test("Context read view uses semantic ordered turns instead of recursive DTO fields", () => {
  assert.match(readView, /<TopicContextResourceView\s+value=\{item\.context\}\s*\/>/);
  assert.doesNotMatch(readView, /<ResourceValue\s+value=\{item\.context\}\s*\/>/);
  assert.match(presentation, /value\.dialogue\s+\.map\(\(turn, index\)/);
  assert.match(presentation, /turn\.speaker/);
  assert.match(presentation, /turn\.textEn/);
  assert.match(presentation, /turn\.textVi/);
  assert.match(presentation, /turn\.audioUrl/);
  assert.match(contextReadUtils, /value\.durationSec\s*!==\s*null/);
});

test("Context audio distinguishes missing, invalid and native playback failure and resets on source changes", () => {
  assert.match(presentation, /useEffect\([\s\S]*\[source\]/);
  assert.match(presentation, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(presentation, /role="alert"/);
  assert.match(presentation, /Không thể tải hoặc phát âm thanh này\./);
  assert.match(presentation, /Nguồn âm thanh không hợp lệ\./);
  assert.match(presentation, /Chưa có âm thanh cho lời thoại này\./);
});

test("Only empty Draft Context exposes a same-item editor link", () => {
  assert.match(readView, /item\.status === "DRAFT"/);
  assert.match(readView, /topicItemSectionPath\(item\.id, "context", item\.topicId\)/);
  assert.match(readView, /Thêm bối cảnh/);
  assert.match(contextReadUtils, /hasContextContent/);
});

test("Context action does not shrink empty status banners on adjacent resource tabs", () => {
  const panel = readView.match(/function ResourcePanel\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(panel, /className="grid gap-3"/);
  assert.doesNotMatch(panel, /grid justify-items-start/);
  assert.match(panel, /role="status" className="flex items-center gap-2 rounded-lg bg-surface-container-low p-4/);
  assert.match(panel, /<div className="justify-self-start">\{emptyAction\}<\/div>/);
});

test("All authored Context text fields safely wrap long unbroken strings", () => {
  assert.match(presentation, /scenarioDescription[\s\S]*?break-words/);
  assert.match(presentation, /value\.prompt[\s\S]*?break-words/);
  assert.match(presentation, /turn\.speaker[\s\S]*?break-words/);
  assert.match(presentation, /turn\.textEn[\s\S]*?break-words/);
  assert.match(presentation, /turn\.textVi[\s\S]*?break-words/);
  assert.match(presentation, /value\.tips[\s\S]*?break-words/);
});
