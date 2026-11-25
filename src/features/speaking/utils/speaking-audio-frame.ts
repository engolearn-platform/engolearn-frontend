const HEADER_BYTES = 28;
const MAX_PAYLOAD_BYTES = 8192;
const MAGIC = [0x53, 0x50, 0x4b, 0x32];

function uuidBytes(uuid: string): Uint8Array {
  const compact = uuid.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(compact)) throw new TypeError("Turn ID must be a UUID.");
  const parts = compact.match(/.{2}/g);
  if (!parts) throw new TypeError("Turn ID must be a UUID.");
  return Uint8Array.from(parts.map(byte => Number.parseInt(byte, 16)));
}

export function createSpeakingAudioFrame(turnId: string, chunkIndex: number, pcm: ArrayBuffer | Uint8Array): ArrayBuffer {
  const bytes = pcm instanceof Uint8Array ? pcm : new Uint8Array(pcm);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 0xffff_ffff) throw new RangeError("Invalid audio chunk index.");
  if (bytes.length === 0 || bytes.length > MAX_PAYLOAD_BYTES || bytes.length % 2 !== 0) throw new RangeError("PCM payload must be 1–8192 even bytes.");
  const frame = new Uint8Array(HEADER_BYTES + bytes.length);
  frame.set(MAGIC, 0);
  frame[4] = 1;
  frame.set(uuidBytes(turnId), 8);
  new DataView(frame.buffer).setUint32(24, chunkIndex, false);
  frame.set(bytes, HEADER_BYTES);
  return frame.buffer;
}

export function readSpeakingAudioFrame(frame: ArrayBuffer, expectedTurnId: string, expectedChunkIndex: number): Uint8Array {
  const bytes = new Uint8Array(frame);
  if (bytes.length <= HEADER_BYTES || bytes.length > HEADER_BYTES + MAX_PAYLOAD_BYTES) throw new RangeError("Invalid audio frame size.");
  if (!MAGIC.every((byte, index) => bytes[index] === byte) || bytes[4] !== 2 || bytes[5] || bytes[6] || bytes[7]) {
    throw new TypeError("Invalid assistant audio frame header.");
  }
  if (!uuidBytes(expectedTurnId).every((byte, index) => bytes[8 + index] === byte)) throw new TypeError("Audio frame turn ID mismatch.");
  if (new DataView(frame).getUint32(24, false) !== expectedChunkIndex) throw new TypeError("Audio frame chunk order mismatch.");
  return bytes.subarray(HEADER_BYTES);
}
