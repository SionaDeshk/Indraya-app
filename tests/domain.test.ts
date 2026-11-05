import { test } from "node:test";
import assert from "node:assert/strict";
import { validateReport, demo, age } from "../src/domain";
test("rejects invalid reports and coordinates", () => {
  assert.throws(() => validateReport("ice", "short", 61, -149));
  assert.throws(() =>
    validateReport("Valid title", "Valid description", NaN, -149),
  );
  assert.throws(() =>
    validateReport("Valid title", "Valid description", 91, 0),
  );
  assert.doesNotThrow(() =>
    validateReport("Trail ice", "Ice near the public trail.", 61, -149),
  );
});
test("all sample data carries explicit provenance and unverified status", () => {
  assert.equal(demo.length, 3);
  for (const row of demo) {
    assert.equal(row.demo, true);
    assert.match(row.source, /DEMO/);
    assert.equal(row.verification, "unverified");
    assert.match(row.description, /DEMO/);
  }
});
test("old observations are marked stale", () =>
  assert.match(age("2020-01-01T00:00:00Z"), /STALE/));
