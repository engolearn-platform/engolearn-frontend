import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createSpeakingAudioFrame, readSpeakingAudioFrame } from "../src/features/speaking/utils/speaking-audio-frame.ts";

const fixture = JSON.parse(await readFile(new URL("../../docs/system-design/speaking-v2-protocol.fixture.json", import.meta.url), "utf8"));

test("learner audio framing matches the frozen shared fixture", () => {
  const turnId = fixture.rest.turns.data.items[0].turnId;
  const frame = createSpeakingAudioFrame(turnId, 0, new Uint8Array([1, 0, 255, 255]));
  assert.equal(Buffer.from(frame).toString("hex"), fixture.ws.learnerChunkHex);
});

test("assistant frame validation checks direction, UUID, index, and reserved bytes", () => {
  const expected = "dff51e78-0b05-48c6-9ad8-a7fe456c2998";
  const raw = Buffer.from(fixture.ws.learnerChunkHex, "hex");
  raw[4] = 2;
  const frame = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  assert.deepEqual([...readSpeakingAudioFrame(frame, expected, 0)], [1, 0, 255, 255]);
  assert.throws(() => readSpeakingAudioFrame(frame, expected, 1), /chunk order/);
  raw[5] = 1;
  const invalid = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  assert.throws(() => readSpeakingAudioFrame(invalid, expected, 0), /header/);
});

test("uplink framing rejects odd, oversized, and malformed input", () => {
  const turnId = fixture.rest.turns.data.items[0].turnId;
  assert.throws(() => createSpeakingAudioFrame(turnId, 0, new Uint8Array([0])), /even bytes/);
  assert.throws(() => createSpeakingAudioFrame(turnId, 0, new Uint8Array(8194)), /even bytes/);
  assert.throws(() => createSpeakingAudioFrame("turn", 0, new Uint8Array([0, 0])), /UUID/);
});
