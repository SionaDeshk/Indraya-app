import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sanitizeVideo } from "../supabase/functions/_shared/video";
const fixture = readFileSync(
  new URL("./fixtures/video-with-metadata.mp4", import.meta.url),
);
test("QuickTime MOV uses session-independent media data and removes location/title metadata", () => {
  const mov = readFileSync(
    new URL("./fixtures/video-with-metadata.mov", import.meta.url),
  );
  const result = sanitizeVideo(mov);
  assert.equal(result.mime, "video/quicktime");
  assert.equal(result.duration, 2);
  assert.equal(result.bytes.length, mov.length);
  assert(
    !Buffer.from(result.bytes).includes(Buffer.from("PRIVATE TEST VIDEO")),
  );
  assert(!Buffer.from(result.bytes).includes(Buffer.from("+61.2181")));
});
test("MP4 sanitization removes private metadata while preserving movie offsets and duration", () => {
  assert(fixture.includes(Buffer.from("PRIVATE TEST VIDEO")));
  const result = sanitizeVideo(fixture);
  assert.equal(result.mime, "video/mp4");
  assert(result.duration >= 2 && result.duration <= 2.1);
  assert.equal(result.bytes.length, fixture.length);
  assert(
    !Buffer.from(result.bytes).includes(Buffer.from("PRIVATE TEST VIDEO")),
  );
  assert(!Buffer.from(result.bytes).includes(Buffer.from("+61.2181")));
  const mdat = fixture.indexOf(Buffer.from("mdat"));
  assert(mdat > 0);
  assert.deepEqual(
    result.bytes.slice(mdat),
    new Uint8Array(fixture.subarray(mdat)),
  );
  assert.deepEqual(sanitizeVideo(result.bytes).bytes, result.bytes);
});
test("video rejects wrong formats, fragmented structures, excessive duration, broken boxes and oversize files", () => {
  for (const bytes of [
    new Uint8Array(4),
    new Uint8Array(21 * 1024 * 1024),
    fixture.subarray(0, fixture.length - 1),
  ])
    assert.throws(() => sanitizeVideo(bytes));
  const long = Uint8Array.from(fixture);
  const view = new DataView(long.buffer);
  const mvhd = fixture.indexOf(Buffer.from("mvhd")) - 4;
  const scale = view.getUint32(mvhd + 20);
  view.setUint32(mvhd + 24, scale * 61);
  assert.throws(() => sanitizeVideo(long), /60 seconds/);
  const fragmented = Uint8Array.from(fixture);
  fragmented.set(Buffer.from("moof"), 4);
  assert.throws(() => sanitizeVideo(fragmented));
});
