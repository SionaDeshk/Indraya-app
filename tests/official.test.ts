import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseWeather,
  parseEarthquakes,
  inAlaskaRegion,
  loadOfficialFeed,
  currentOfficialItems,
} from "../src/official/adapters";
import { reportTitles } from "../src/domain";
const now = Date.parse("2026-11-08T00:00:00Z");
const collection = (features: unknown[]) => ({
  type: "FeatureCollection",
  features,
});
const alert = (
  overrides: Record<string, unknown> = {},
  geometry: unknown = null,
) => ({
  type: "Feature",
  id: "TEST-FIXTURE",
  geometry,
  properties: {
    event: "Test fixture weather alert",
    headline: "TEST FIXTURE · not a real alert",
    status: "Actual",
    messageType: "Alert",
    sent: "2026-11-07T23:00:00Z",
    expires: "2026-11-08T01:00:00Z",
    description: "Synthetic parser fixture. Never included in the app.",
    ...overrides,
  },
});
const quake = (
  coords: unknown = [-149.9, 61.2, 10],
  overrides: Record<string, unknown> = {},
) => ({
  type: "Feature",
  id: "TEST-QUAKE",
  geometry: { type: "Point", coordinates: coords },
  properties: {
    mag: 3.2,
    time: now - 60000,
    place: "TEST FIXTURE ONLY",
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/test",
    ...overrides,
  },
});
test("NWS keeps genuine active alerts, rejects test/expired/cancelled alerts and never invents missing geography", () => {
  const items = parseWeather(
    collection([
      alert(),
      alert({ status: "Test" }),
      alert({ expires: "2026-11-07T23:59:00Z" }),
      alert({ messageType: "Cancel" }),
      alert({ sent: "bad date" }),
      alert({ sent: "2026-11-08T02:00:00Z" }),
    ]),
    now,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].geometry, null);
  assert.equal(items[0].sourceName, "National Weather Service");
});
test("NWS retains valid source polygon and discards malformed boundaries", () => {
  const geometry = {
    type: "Polygon",
    coordinates: [
      [
        [-150, 60],
        [-149, 60],
        [-149, 61],
        [-150, 60],
      ],
    ],
  };
  assert.deepEqual(
    parseWeather(collection([alert({}, geometry)]), now)[0].geometry,
    geometry,
  );
  assert.equal(
    parseWeather(
      collection([
        alert(
          {},
          {
            type: "Polygon",
            coordinates: [
              [
                [999, 60],
                [1, 1],
                [2, 2],
                [999, 60],
              ],
            ],
          },
        ),
      ]),
      now,
    )[0].geometry,
    null,
  );
});
test("source links are restricted to trusted HTTPS origins", () => {
  const items = parseWeather(
    collection([alert({ "@id": "https://evil.example/collect" })]),
    now,
  );
  assert.match(items[0].sourceUrl, /^https:\/\/api.weather.gov\//);
  const items2 = parseEarthquakes(
    collection([quake(undefined, { url: "javascript:alert(1)" })]),
    now,
  );
  assert.match(items2[0].sourceUrl, /^https:\/\/earthquake.usgs.gov\//);
});
test("USGS enforces magnitude, last-day window, finite coordinates and Alaska regional bounds", () => {
  const items = parseEarthquakes(
    collection([
      quake(),
      quake([-70, 40]),
      quake([-149, 61], { time: now - 86400001 }),
      quake([-149, 61], { mag: 1 }),
      quake([NaN, 61]),
      quake([-149, 61], { time: now + 1000 }),
    ]),
    now,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].feed, "earthquakes");
  assert.match(items[0].description, /Preliminary/);
  assert.equal(inAlaskaRegion(179, 52), true);
  assert.equal(inAlaskaRegion(-179, 52), true);
  assert.equal(inAlaskaRegion(0, 60), false);
});
test("expired cached reports are hidden and failed response formats are errors", () => {
  const item = parseWeather(collection([alert()]), now)[0];
  assert.equal(
    currentOfficialItems(
      { fetchedAt: new Date(now).toISOString(), items: [item] },
      now + 7200000,
    ).length,
    0,
  );
  assert.throws(() => parseWeather({ error: "unavailable" }, now));
  assert.throws(() => parseEarthquakes({}, now));
});
test("unvalidated feeds remain disabled and never contact a remote service", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw Error("Must not fetch");
  };
  try {
    await assert.rejects(loadOfficialFeed("weather"), /not connected/);
    await assert.rejects(loadOfficialFeed("earthquakes"), /not connected/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});
test("category suggestions are editable starting titles, with wildlife and smoke options", () => {
  assert.ok(reportTitles.Outdoors.includes("Whale sighting"));
  assert.ok(reportTitles.Safety.includes("Smoke observed"));
  for (const options of Object.values(reportTitles))
    assert.ok(
      options.every((title) => title.length >= 5 && title.length <= 100),
    );
});

test("official endpoint failures remain errors rather than reporting zero incidents", async () => {
  const { checkOfficialEndpoint } = await import("../src/official/adapters");
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(checkOfficialEndpoint("weather"), /HTTP 503/);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "invalid schema" }), {
        status: 200,
      });
    await assert.rejects(
      checkOfficialEndpoint("earthquakes"),
      /unexpected format/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
