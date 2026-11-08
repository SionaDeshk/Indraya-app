import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  sanitizeJpeg,
  decodeBase64,
  encodeBase64,
} from "../supabase/functions/_shared/media";
import {
  defaultKind,
  reportAppearance,
  reportKinds,
  validateDetails,
  withinBounds,
  distanceKm,
} from "../src/domain";
const now = Date.parse("2026-11-08T00:00:00Z");
test("marker/card color uses explicit kind, with legacy category fallback", () => {
  assert.equal(
    reportAppearance({ category: "Safety", kind: "smoke" }).color,
    reportKinds.smoke.color,
  );
  assert.equal(
    reportAppearance({ category: "Travel" }).color,
    reportKinds[defaultKind.Travel].color,
  );
  assert.equal(
    reportAppearance({ category: "Outdoors", kind: "wildlife" }).color,
    reportKinds.wildlife.color,
  );
});
test("rejects future/stale observation times, wrong category and invalid counts", () => {
  assert.doesNotThrow(() =>
    validateDetails(
      "Outdoors",
      "wildlife",
      { animal: "Beluga", count: 4 },
      new Date(now - 60000).toISOString(),
      now,
    ),
  );
  assert.throws(() =>
    validateDetails("Safety", "wildlife", {}, new Date(now).toISOString(), now),
  );
  for (const count of [0, 1.5, NaN, 10001])
    assert.throws(() =>
      validateDetails(
        "Outdoors",
        "wildlife",
        { count },
        new Date(now).toISOString(),
        now,
      ),
    );
  assert.throws(() =>
    validateDetails(
      "Travel",
      "road",
      {},
      new Date(now + 120000).toISOString(),
      now,
    ),
  );
  assert.throws(() =>
    validateDetails(
      "Travel",
      "road",
      {},
      new Date(now - 31 * 86400000).toISOString(),
      now,
    ),
  );
});
test("viewport and distance handle antimeridian and nearby activity", () => {
  assert.equal(
    withinBounds({ latitude: 52, longitude: 179 }, [170, 50, -170, 60]),
    true,
  );
  assert.equal(
    withinBounds({ latitude: 52, longitude: 0 }, [170, 50, -170, 60]),
    false,
  );
  assert.equal(
    distanceKm(
      { latitude: 61, longitude: -149 },
      { latitude: 61, longitude: -149 },
    ),
    0,
  );
  assert.ok(
    distanceKm(
      { latitude: 0, longitude: 179 },
      { latitude: 0, longitude: -179 },
    ) < 225,
  );
});
test("JPEG re-encoding sanitizer removes EXIF/location, comments, APP data and trailing payload", () => {
  const source = readFileSync(
    new URL("./fixtures/photo-with-metadata.jpg", import.meta.url),
  );
  assert.ok(source.includes(Buffer.from("PRIVATE TEST GPS")));
  const comment = Buffer.from([255, 254, 0, 8, 83, 69, 67, 82, 69, 84]);
  const input = Buffer.concat([
    source.subarray(0, 2),
    comment,
    source.subarray(2),
    Buffer.from("TRAILING PRIVATE DATA"),
  ]);
  const cleaned = sanitizeJpeg(input);
  assert.equal(
    Buffer.from(cleaned).includes(Buffer.from("PRIVATE TEST GPS")),
    false,
  );
  assert.equal(Buffer.from(cleaned).includes(Buffer.from("SECRET")), false);
  assert.equal(
    Buffer.from(cleaned).includes(Buffer.from("TRAILING PRIVATE DATA")),
    false,
  );
  assert.deepEqual(sanitizeJpeg(cleaned), cleaned);
  assert.deepEqual(decodeBase64(encodeBase64(cleaned)), cleaned);
});
test("JPEG sanitizer rejects truncated/nonimage/oversize files", () => {
  assert.throws(() => sanitizeJpeg(new Uint8Array([1, 2, 3])));
  assert.throws(() => sanitizeJpeg(new Uint8Array(3 * 1024 * 1024)));
  const source = readFileSync(
    new URL("./fixtures/photo-with-metadata.jpg", import.meta.url),
  );
  assert.throws(() => sanitizeJpeg(source.subarray(0, source.length - 2)));
});
