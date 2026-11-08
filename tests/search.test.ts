import { test } from "node:test";
import assert from "node:assert/strict";
import { savedPlaces, parsePhoton } from "../src/searchDomain";
test("offline search covers requested towns and Knik features, case and whitespace", () => {
  for (const query of ["Girdwood", "Wasilla", "Knik River", "Knik Glacier"])
    assert.ok(
      savedPlaces(`  ${query.toUpperCase()}  `).some((p) => p.name === query),
    );
  assert.equal(savedPlaces("").length, 0);
});
test("online search normalizes geographic features and restaurants without invented coordinates", () => {
  const body = {
    type: "FeatureCollection",
    features: [
      {
        geometry: { type: "Point", coordinates: [-149.16, 60.94] },
        properties: {
          name: "TEST RESTAURANT",
          city: "Girdwood",
          state: "Alaska",
          country: "United States",
        },
      },
      {
        geometry: { type: "Point", coordinates: [999, 100] },
        properties: { name: "Invalid" },
      },
      {
        geometry: { type: "Point", coordinates: ["wrong", 60] },
        properties: { name: "Invalid" },
      },
    ],
  };
  const results = parsePhoton(body);
  assert.equal(results.length, 1);
  assert.equal(results[0].provider, "photon");
  assert.match(results[0].context ?? "", /Girdwood/);
  assert.throws(() => parsePhoton({ error: "Unavailable" }));
});
