import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePhoton, normalize } from "../src/searchDomain";
test("accepts the documented Photon features-only format and normalizes extent W,N,E,S", () => {
  const results = parsePhoton({
    features: [
      {
        geometry: { type: "Point", coordinates: [13.2395, 52.5146] },
        properties: {
          name: "Berlin Olympic Stadium",
          osm_value: "stadium",
          extent: [13.237, 52.516, 13.242, 52.513],
          city: "Berlin",
        },
      },
    ],
  });
  assert.equal(results.length, 1);
  assert.deepEqual(results[0].bounds, [13.237, 52.513, 13.242, 52.516]);
  assert.equal(results[0].focusZoom, 15);
  assert.equal(normalize("  GÍRDWOOD  "), "girdwood");
});
test("parses real coordinates, context and type without fake fallback; rejects malformed-only results", () => {
  const body = {
    type: "FeatureCollection",
    features: [
      {
        geometry: { type: "Point", coordinates: [-149.16, 60.94] },
        properties: {
          name: "TEST RESTAURANT",
          city: "Girdwood",
          osm_value: "restaurant",
        },
      },
      {
        geometry: { type: "Point", coordinates: [999, 100] },
        properties: { name: "Invalid" },
      },
    ],
  };
  const result = parsePhoton(body);
  assert.equal(result.length, 1);
  assert.equal(result[0].featureType, "restaurant");
  assert.match(result[0].context ?? "", /Girdwood/);
  assert.throws(() => parsePhoton({ features: [body.features[1]] }));
  assert.throws(() => parsePhoton({ error: "Unavailable" }));
  assert.deepEqual(parsePhoton({ features: [] }), []);
});
test("identifies address-only results for private-label protection and preserves ambiguity", () => {
  const results = parsePhoton({
    features: [
      {
        geometry: { type: "Point", coordinates: [-149, 61] },
        properties: {
          street: "TEST STREET",
          housenumber: "123",
          osm_value: "house",
        },
      },
      {
        geometry: { type: "Point", coordinates: [-148, 62] },
        properties: { name: "Springfield", state: "Alaska" },
      },
      {
        geometry: { type: "Point", coordinates: [-147, 63] },
        properties: { name: "Springfield", state: "Another region" },
      },
    ],
  });
  assert.equal(results[0].privateAddress, true);
  assert.equal(results.filter((p) => p.name === "Springfield").length, 2);
});
