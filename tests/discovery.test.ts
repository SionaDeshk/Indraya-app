import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { catalog } from "../src/taxonomy";
import {
  observationSymbols,
  observationSymbol,
} from "../src/observationSymbols";
import {
  parsePhoton,
  rankPlaces,
  initialPlaceCount,
} from "../src/searchDomain";
import { summaryFacts } from "../src/observationSummary";
import { regionalLinks, sourceRegion } from "../src/regionalSources";
import type { Observation } from "../src/domain";
const report = (changes = {}) =>
  ({
    id: "test",
    category: "Outdoors",
    title: "Test",
    description: "",
    longitude: -149,
    latitude: 61,
    created_at: new Date().toISOString(),
    verification: "unverified",
    source: "community",
    ...changes,
  }) as Observation;
test("every catalog type has a specific original bundled icon and legacy observations keep a fallback", () => {
  const registry = readFileSync("src/eventSymbolImages.ts", "utf8");
  for (const type of Object.values(catalog.types)) {
    const entry = observationSymbols[type.id];
    assert.ok(entry, type.id);
    assert.ok(
      existsSync(`assets/observation-symbols/${entry.symbol}.png`),
      entry.symbol,
    );
    assert.ok(registry.includes(entry.symbol));
  }
  assert.notEqual(
    observationSymbols.avalanche.symbol,
    observationSymbols.high_wind?.symbol,
  );
  assert.notEqual(
    observationSymbols.ice_climbing.symbol,
    observationSymbols.ice_skating?.symbol,
  );
  assert.equal(
    observationSymbol(
      report({
        event_type_id: "motorized_access",
        answers: { vehicle_type: "4x4" },
      }),
    ).symbol,
    "event-four-by-four",
  );
  assert.ok(observationSymbol(report()).symbol);
});
test("same provider feature deduplicates; nearby business branches remain separate", () => {
  const f = (id: number, name: string, kind: string, x = -149.13) => ({
    geometry: { type: "Point", coordinates: [x, 60.96] },
    properties: {
      name,
      osm_type: "N",
      osm_id: id,
      osm_value: kind,
      state: "Alaska",
    },
  });
  const rows = parsePhoton({
    features: [
      f(1, "Girdwood", "station"),
      f(2, "Girdwood", "village"),
      f(2, "Girdwood", "village"),
      f(3, "Cafe", "cafe"),
      f(4, "Cafe", "cafe", -149.13001),
    ],
  });
  assert.equal(rows.length, 4);
  const ranked = rankPlaces(rows, "Girdwood");
  assert.equal(ranked[0].placeId, "osm:N:2");
  assert.equal(initialPlaceCount(ranked, "Girdwood"), 1);
  assert.equal(initialPlaceCount(rankPlaces(rows, "Cafe"), "Cafe"), 3);
});
test("compact facts prioritize unmeasured ice and never imply ice safety", () => {
  const answers = {
    water_context: "lake",
    ice_texture: "glass",
    ice_measurement: "not_measured",
  };
  const facts = summaryFacts(report({ answers }));
  assert.equal(facts[0], "Thickness not measured");
  assert.ok(facts.length <= 3);
  assert.ok(!facts.join(" ").includes("safe"));
});
test("context links retain source names and region choice rather than fabricate forecasts", () => {
  assert.equal(sourceRegion("Hatcher Pass"), "hatcher");
  assert.equal(sourceRegion("Tincan Peak"), "girdwood");
  assert.ok(
    regionalLinks("girdwood", "avalanche").some(
      (l) =>
        l.label.includes("Chugach Avalanche Center") &&
        l.url === "https://www.cnfaic.org/",
    ),
  );
  assert.ok(
    regionalLinks("hatcher", "avalanche").some(
      (l) => l.url === "https://hpavalanche.org/",
    ),
  );
  assert.ok(
    !regionalLinks("girdwood", "fish_activity").some((l) =>
      l.label.includes("Avalanche"),
    ),
  );
});

test("mapped reference outlines match exact OSM identity and never follow an adjusted/private pin", async () => {
  const { placeOutline } = await import("../src/placeOutlines");
  const lake = {
    name: "Eklutna Lake",
    latitude: 61.37,
    longitude: -149.03,
    placeId: "osm:W:49200373",
  };
  const outline = placeOutline(lake);
  assert.equal(outline?.geometry.type, "MultiPolygon");
  assert.equal(placeOutline({ ...lake, placeId: undefined }), undefined);
  assert.equal(placeOutline({ ...lake, privateAddress: true }), undefined);
  assert.equal(placeOutline({ ...lake, placeId: "osm:N:49200373" }), undefined);
  const coordinates = (outline?.geometry as GeoJSON.MultiPolygon).coordinates;
  for (const polygon of coordinates)
    for (const ring of polygon) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring[0], ring.at(-1));
      assert.ok(
        ring.every(
          ([x, y]) =>
            Number.isFinite(x) &&
            Number.isFinite(y) &&
            x >= -180 &&
            x <= 180 &&
            y >= 51 &&
            y <= 72,
        ),
      );
    }
});

test("My observations sort by sharing time, not a backdated sighting; editing has an absolute deadline", async () => {
  const { newestFirst, editTimeLeft, EDIT_WINDOW_MS } =
    await import("../src/myObservations");
  const now = Date.now(),
    old = report({
      id: "old",
      created_at: new Date(now - 3600000).toISOString(),
    }),
    recent = report({
      id: "recent",
      created_at: new Date(now - 60000).toISOString(),
      observed_at: new Date(now - 86400000).toISOString(),
    });
  assert.deepEqual(
    newestFirst([old, recent]).map((r) => r.id),
    ["recent", "old"],
  );
  assert.equal(editTimeLeft(recent, now), EDIT_WINDOW_MS - 60000);
  assert.equal(
    editTimeLeft(recent, Date.parse(recent.created_at) + EDIT_WINDOW_MS),
    0,
  );
  assert.equal(editTimeLeft({ ...recent, verification: "reviewed" }, now), 0);
  assert.equal(editTimeLeft({ ...recent, status: "review" }, now), 0);
  assert.equal(
    editTimeLeft(
      { ...recent, created_at: new Date(now + 1000).toISOString() },
      now,
    ),
    0,
  );
});
test("NWS units, missing wind, untrusted URLs and future readings fail safely", async () => {
  const { windMph, nwsURL, stationReading } =
    await import("../src/weatherStations");
  assert.equal(windMph({ value: 100, unitCode: "wmoUnit:km_h-1" }), 62);
  assert.equal(windMph({ value: 0, unitCode: "wmoUnit:m_s-1" }), 0);
  assert.equal(windMph({ value: null, unitCode: "wmoUnit:m_s-1" }), null);
  assert.equal(windMph({ value: 12, unitCode: "unknown" }), null);
  assert.equal(
    windMph({ value: 12, unitCode: "wmoUnit:m_s-1", qualityControl: "Z" }),
    null,
  );
  assert.throws(() =>
    nwsURL("https://api.weather.gov.evil.test/stations/PATO"),
  );
  assert.throws(() => nwsURL("https://api.weather.gov:444/stations/PATO"));
  assert.throws(() =>
    stationReading({
      properties: { timestamp: new Date(Date.now() + 3600000).toISOString() },
    }),
  );
  const value = stationReading({
    properties: {
      timestamp: new Date().toISOString(),
      temperature: { value: 0, unitCode: "wmoUnit:degC" },
      windSpeed: { value: null, unitCode: "wmoUnit:m_s-1" },
    },
  });
  assert.equal(value.temperature, 32);
  assert.equal(value.wind, null);
});

test("verified recreation search keeps map identities and proprietary guides separate", async () => {
  const { recreationPlaces, recreationReferences, mergePlaces } =
    await import("../src/recreationPlaces");
  const local = recreationPlaces("Hatch Peak");
  assert.equal(local.length, 1);
  assert.equal(local[0].placeId, "osm:N:7817817326");
  assert.equal(mergePlaces(local, local).length, 1);
  assert.equal(recreationPlaces("Beer Climbs").length, 0);
  assert.equal(recreationPlaces("Seattle Ridge").length, 0);
  assert.ok(
    recreationReferences("Beers climb")[0].url.includes(
      "111518793/beer-climbs",
    ),
  );
});

test("expanded outlines preserve real multipolygons, park enclaves and lake islands", async () => {
  const data = JSON.parse(
    readFileSync("data/place-outlines.json", "utf8"),
  ) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  assert.equal(data.features.length, 21);
  const ids = data.features.map((f) => f.properties?.placeId);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of data.features) {
    const polygons =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    assert.ok(polygons.length > 0);
    for (const polygon of polygons)
      for (const ring of polygon) {
        assert.ok(ring.length >= 4);
        assert.deepEqual(ring[0], ring.at(-1));
        assert.ok(
          ring.every(
            ([x, y]) =>
              Number.isFinite(x) &&
              Number.isFinite(y) &&
              x >= -180 &&
              x <= -129.9 &&
              y >= 51 &&
              y <= 72,
          ),
        );
      }
  }
  const park = data.features.find(
    (f) => f.properties?.placeId === "osm:R:12188016",
  );
  assert.equal(park?.geometry.type, "MultiPolygon");
  const parts = (park?.geometry as GeoJSON.MultiPolygon).coordinates;
  assert.equal(parts.length, 10);
  assert.equal(
    parts.reduce((n, p) => n + p.length - 1, 0),
    9,
  );
  const lake = data.features.find(
    (f) => f.properties?.placeId === "osm:R:1555333",
  );
  assert.equal((lake?.geometry as GeoJSON.Polygon).coordinates.length - 1, 13);
  assert.ok(ids.includes("osm:W:1343608838"));
  assert.ok(
    !ids.includes("osm:N:241887948"),
    "a summit never acquires a guessed area outline",
  );
});
test("common spellings find genuine map features while ski/climb guide links stay separate", async () => {
  const { recreationPlaces, recreationReferences } =
    await import("../src/recreationPlaces");
  assert.equal(
    recreationPlaces("Alyeska Mountain")[0].placeId,
    "osm:N:241887948",
  );
  assert.ok(
    recreationPlaces("Hatchers Pass area").some(
      (p) => p.placeId === "osm:W:1343608838",
    ),
  );
  assert.ok(
    recreationPlaces("Ekluta Lake").some((p) => p.placeId === "osm:W:49200373"),
  );
  const government = recreationPlaces("Government Peak");
  assert.equal(government.length, 1);
  assert.equal(government[0].provider, "gnis");
  assert.equal(government[0].placeId, "gnis:1402812");
  assert.ok(
    recreationReferences("ski lines")[0].url.includes("powderproject.com"),
  );
  assert.ok(
    recreationReferences("Alaska ice climbs")[0].url.includes("105909315"),
  );
});
