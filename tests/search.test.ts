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

test("Alaska search excludes out-of-state matches and foreign border results while keeping Southeast and Aleutians", async () => {
  const { alaskaPlaces } = await import("../src/searchDomain");
  const make = (
    name: string,
    longitude: number,
    latitude: number,
    state?: string,
    countryCode?: string,
  ) => ({
    name,
    longitude,
    latitude,
    state,
    countryCode,
    provider: "photon" as const,
  });
  const results = alaskaPlaces([
    make("Girdwood", -149.16, 60.94, "Alaska", "US"),
    make("Wasilla", -149.44, 61.58, "Alaska", "US"),
    make("Hyder", -130.03, 55.91, "Alaska", "US"),
    make("Attu", 172.9, 52.9, "Alaska", "US"),
    make("Adak", -176.6, 51.9, undefined, "US"),
    make("Palmer Massachusetts", -72.33, 42.15, "Massachusetts", "US"),
    make("Portland", -122.67, 45.52, "Oregon", "US"),
    make("Yukon", -140, 65, "Yukon", "CA"),
    make("Russian island", 175, 55, undefined, "RU"),
    make("Conflicting administration", -149, 61, "Washington", "US"),
    make("Unknown administration", -149, 61),
    {
      ...make("Bad feature extent", -149, 61, "Alaska", "US"),
      bounds: [-170, 30, -70, 70] as [number, number, number, number],
    },
  ]);
  assert.deepEqual(
    results.map((p) => p.name),
    ["Girdwood", "Wasilla", "Hyder", "Attu", "Adak", "Bad feature extent"],
  );
  assert.equal(results.at(-1)?.bounds, undefined);
});
