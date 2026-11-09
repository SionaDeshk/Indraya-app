import { test } from "node:test";
import assert from "node:assert/strict";
import { nearbyObservations, nearbySource } from "../src/nearbyObservations";
import { extentIntersectsBounds } from "../src/observationExtent";
import { searchTypes, type Selection } from "../src/taxonomy";
import { parseDraft } from "../src/observationDraft";
import { newRequestId, validRequestId } from "../src/submission";
import type { Observation } from "../src/domain";
const now = Date.parse("2026-11-09T01:00:00Z");
const row = {
  id: "one",
  category: "Travel",
  domain_id: "travel",
  title: "Synthetic ice",
  description: "",
  latitude: 61.22,
  longitude: -149.9,
  created_at: new Date(now - 1000).toISOString(),
  expires_at: new Date(now + 1000).toISOString(),
  privacy_class: "approximate",
} as Observation;
test("offline nearby source preserves saved rows but never replaces a successful empty live result", () => {
  const options = {
    loaded: [row],
    spatial: undefined,
    viewport: true,
    history: false,
    failed: true,
    savedAt: now,
  };
  const cached = nearbySource(options);
  assert.equal(cached.snapshot, true);
  assert.equal(cached.spatiallyMatched, false);
  assert.equal(cached.rows[0].offline_snapshot_at, new Date(now).toISOString());
  const nearby = {
    now,
    history: false,
    domain: "all",
    bounds: null,
    center: [-149.9, 61.22] as [number, number],
    spatiallyMatched: cached.spatiallyMatched,
  };
  assert.equal(nearbyObservations(cached.rows, nearby).length, 1);
  assert.equal(
    nearbyObservations(cached.rows, { ...nearby, now: now + 1000 }).length,
    0,
  );
  assert.deepEqual(
    nearbySource({ ...options, failed: false, spatial: [] }).rows,
    [],
  );
  assert.equal(nearbySource({ ...options, loaded: [] }).snapshot, false);
  assert.equal(
    nearbyObservations(cached.rows, { ...nearby, domain: "wildlife" }).length,
    0,
  );
});
test("saved snapshot geometry intersects crossing lines and enclosing polygons without false positives", () => {
  const bounds: [number, number, number, number] = [
    -149.89, 61.23, -149.88, 61.24,
  ];
  assert(
    extentIntersectsBounds(
      {
        type: "LineString",
        coordinates: [
          [-149.9, 61.235],
          [-149.87, 61.235],
        ],
      },
      bounds,
    ),
  );
  assert(
    extentIntersectsBounds(
      {
        type: "Polygon",
        coordinates: [
          [
            [-149.91, 61.22],
            [-149.87, 61.22],
            [-149.87, 61.25],
            [-149.91, 61.25],
            [-149.91, 61.22],
          ],
        ],
      },
      bounds,
    ),
  );
  assert(
    !extentIntersectsBounds(
      {
        type: "LineString",
        coordinates: [
          [-150, 61],
          [-150, 62],
        ],
      },
      bounds,
    ),
  );
  assert(
    extentIntersectsBounds(
      {
        type: "LineString",
        coordinates: [
          [179.5, 61.3],
          [179.8, 61.3],
        ],
      },
      [179, 61, -179, 62],
    ),
  );
});
test("uncertain save recovery retains request, time and geometry beyond ordinary draft expiry", () => {
  const selection: Selection = {
    domainId: "travel",
    topicId: "travel.surface",
    typeId: "black_ice",
    relatedIds: [],
  };
  const attempt = {
    requestId: newRequestId(),
    observedAt: new Date(now).toISOString(),
    extent: {
      type: "LineString",
      coordinates: [
        [-149.9, 61.22],
        [-149.88, 61.24],
      ],
    },
  };
  assert(validRequestId(attempt.requestId));
  assert.notEqual(newRequestId(), attempt.requestId);
  const value = {
    selection,
    answers: {},
    title: "Synthetic ice",
    titleEdited: false,
    description: "",
    location: {
      name: "Approximate map area",
      latitude: 61.22,
      longitude: -149.9,
    },
    observedAt: attempt.observedAt,
    attempt,
  };
  const raw = { version: 1, updatedAt: Date.now() - 8 * 86400000, value };
  const parsed = parseDraft(JSON.stringify(raw));
  assert.equal(parsed?.attempt?.requestId, attempt.requestId);
  assert.deepEqual(
    parsed?.attempt?.extent?.coordinates,
    attempt.extent.coordinates,
  );
  assert.equal(
    parseDraft(JSON.stringify({ ...raw, value: { ...value, attempt: null } })),
    null,
  );
  assert.equal(
    parseDraft(
      JSON.stringify({
        ...raw,
        value: {
          ...value,
          attempt: { ...attempt, requestId: "not-a-request" },
        },
      }),
    ),
    null,
  );
});
test("activity forms and exact slang find the right type without altering the deployed catalog", () => {
  assert.equal(searchTypes("pow")[0].type.id, "snow_surface");
  assert(
    searchTypes("snowmachining").some((r) => r.type.id === "motorized_access"),
  );
  assert(
    searchTypes("offroading").some((r) => r.type.id === "motorized_access"),
  );
  assert(
    searchTypes("off-roading", "travel").some(
      (r) => r.type.id === "motorized_access",
    ),
  );
  assert.equal(searchTypes("snowmachining", "wildlife").length, 0);
  assert.equal(searchTypes("shell").length, 0);
});

test("stalled requests abort and caller cancellation is preserved", async (t) => {
  const { fetchWithTimeout } = await import("../src/requestTimeout");
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(
    globalThis,
    "fetch",
    (_input: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        const cancel = () =>
          reject(new DOMException("Synthetic aborted request", "AbortError"));
        if (init?.signal?.aborted) cancel();
        else init?.signal?.addEventListener("abort", cancel, { once: true });
      }),
  );
  const waiting = fetchWithTimeout("https://synthetic.invalid/");
  const assertion = assert.rejects(waiting, { name: "AbortError" });
  t.mock.timers.tick(25000);
  await assertion;
  const controller = new AbortController();
  const cancelled = fetchWithTimeout("https://synthetic.invalid/", {
    signal: controller.signal,
  });
  const cancelAssertion = assert.rejects(cancelled, { name: "AbortError" });
  controller.abort();
  await cancelAssertion;
});
