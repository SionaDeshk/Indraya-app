import { test } from "node:test";
import assert from "node:assert/strict";
import { nearbyObservations } from "../src/nearbyObservations";
import type { Observation, MapBounds } from "../src/domain";

const now = Date.parse("2026-11-09T01:00:00Z");
const bounds: MapBounds = [-149.891, 61.229, -149.889, 61.231];
const options = {
  now,
  history: false,
  domain: "all",
  bounds,
  center: [-149.89, 61.23] as [number, number],
  spatiallyMatched: true,
};
const row: Observation = {
  id: "fixture",
  title: "Synthetic snow condition",
  description: "",
  category: "Safety",
  latitude: 61.22,
  longitude: -149.9,
  created_at: "2026-11-09T00:00:00Z",
  observed_at: "2026-11-09T00:00:00Z",
  expires_at: "2026-11-09T01:01:00Z",
  verification: "unverified",
  source: "Test",
  privacy_class: "approximate",
};

test("cached spatial rows expire from the list on a clock tick without refetching", () => {
  const cached = [row];
  assert.equal(nearbyObservations(cached, options).length, 1);
  assert.equal(
    nearbyObservations(cached, { ...options, now: now + 60000 }).length,
    0,
  );
  assert.equal(
    nearbyObservations(cached, { ...options, now: now + 60000, history: true })
      .length,
    1,
  );
  assert.equal(cached.length, 1); // Expiry changes presentation, not retention.
});

test("server-matched line and area survive an anchor outside the viewport", () => {
  const reports: Observation[] = [
    {
      ...row,
      id: "area",
      extent: {
        type: "Polygon",
        coordinates: [
          [
            [-149.9, 61.22],
            [-149.88, 61.22],
            [-149.88, 61.24],
            [-149.9, 61.22],
          ],
        ],
      },
    },
    {
      ...row,
      id: "line",
      extent: {
        type: "LineString",
        coordinates: [
          [-149.9, 61.22],
          [-149.88, 61.24],
        ],
      },
    },
  ];
  assert.deepEqual(
    nearbyObservations(reports, options).map((r) => r.id),
    ["area", "line"],
  );
  // Global/demo rows have no server intersection guarantee.
  assert.deepEqual(
    nearbyObservations(reports, { ...options, spatiallyMatched: false }),
    [],
  );
});

test("server-matched rows still honor the selected category", () => {
  assert.equal(
    nearbyObservations([row], { ...options, domain: "wildlife" }).length,
    0,
  );
});

test("local points respect bounds, dateline wrapping and the fallback radius", () => {
  const local = { ...options, spatiallyMatched: false };
  assert.equal(nearbyObservations([row], local).length, 0);
  assert.equal(
    nearbyObservations([{ ...row, latitude: 61.23, longitude: -149.89 }], local)
      .length,
    1,
  );
  assert.equal(
    nearbyObservations([{ ...row, latitude: 61.23, longitude: 179.9 }], {
      ...local,
      bounds: [179, 61, -179, 62],
    }).length,
    1,
  );
  assert.equal(nearbyObservations([row], { ...local, bounds: null }).length, 1);
  assert.equal(
    nearbyObservations([row], { ...local, bounds: null, center: [0, 0] })
      .length,
    0,
  );
});

test("nearby ordering uses observed time and does not mutate query cache", () => {
  const reports = [
    row,
    { ...row, id: "newer", observed_at: "2026-11-09T00:30:00Z" },
  ];
  assert.deepEqual(
    nearbyObservations(reports, options).map((r) => r.id),
    ["newer", "fixture"],
  );
  assert.equal(reports[0].id, "fixture");
});
