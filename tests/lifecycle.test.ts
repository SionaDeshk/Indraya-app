import { test } from "node:test";
import assert from "node:assert/strict";
import { validateReportText, Observation } from "../src/domain";
import {
  lifetimeHours,
  isActive,
  observationStatus,
} from "../src/observationLifecycle";
import { normalizeExtent, extentModes } from "../src/observationExtent";
import { parseDraft } from "../src/observationDraft";
import {
  catalog,
  normalizeAnswers,
  Selection,
  searchTypes,
} from "../src/taxonomy";
const selection: Selection = {
  domainId: "weather",
  topicId: "weather.winter",
  typeId: "snow_surface",
  relatedIds: [],
};
test("notes are optional without weakening titles or maximum text bounds", () => {
  assert.doesNotThrow(() => validateReportText("Snow surface", ""));
  assert.doesNotThrow(() => validateReportText("Snow surface", "Pow"));
  assert.throws(() => validateReportText("ice", ""));
  assert.throws(() => validateReportText("Snow surface", "x".repeat(2001)));
});
test("expiry separates observed time from retention and review state", () => {
  const row = {
    id: "test",
    created_at: "2026-11-08T00:00:00Z",
    observed_at: "2026-11-08T00:00:00Z",
    event_type_id: "whiteout",
    status: "published",
  } as Observation;
  assert.equal(lifetimeHours("whiteout"), 6);
  assert.equal(lifetimeHours("washout"), 168);
  assert.equal(isActive(row, Date.parse("2026-11-08T05:59:00Z")), true);
  assert.equal(isActive(row, Date.parse("2026-11-08T06:00:00Z")), false);
  assert.equal(
    observationStatus({ ...row, status: "review" }, Date.parse("2027-01-01"))
      .label,
    "Awaiting review",
  );
  assert.match(
    observationStatus(row, Date.parse("2027-01-01")).explanation,
    /does not mean/,
  );
});
test("extents are contextual, approximate and cannot expose sensitive locations", () => {
  assert.deepEqual(extentModes("animal_sighting"), ["point"]);
  assert(extentModes("collision").includes("line"));
  const extent = {
    type: "LineString" as const,
    coordinates: [
      [-149.9001, 61.2181],
      [-149.88, 61.24],
    ],
  };
  assert.deepEqual(
    normalizeExtent(extent, "black_ice", "approximate", 61.22, -149.9)
      ?.coordinates,
    [
      [-149.9, 61.22],
      [-149.88, 61.24],
    ],
  );
  assert.equal(
    normalizeExtent(extent, "black_ice", "restricted", 61.22, -149.9),
    null,
  );
  assert.throws(() =>
    normalizeExtent(extent, "animal_sighting", "approximate", 61.22, -149.9),
  );
  assert.throws(() =>
    normalizeExtent(extent, "black_ice", "approximate", 60, -149),
  );
});
test("draft recovery rejects corrupt/old data, validates answers and rounds private addresses", () => {
  const make = (extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      value: {
        selection,
        answers: { snow_surface: "powder" },
        title: "Snow surface",
        titleEdited: false,
        description: "",
        observedAt: null,
        location: {
          name: "Private home",
          privateAddress: true,
          latitude: 61.2181,
          longitude: -149.9003,
        },
        ...extra,
      },
    });
  const restored = parseDraft(make());
  assert(restored);
  assert.equal(restored.location?.latitude, 61.22);
  assert.equal(restored.location?.name, "Approximate map area");
  assert.equal(parseDraft("bad"), null);
  assert.equal(
    parseDraft(make({ answers: { snow_surface: "invented" } })),
    null,
  );
  const old = JSON.parse(make());
  old.updatedAt -= 8 * 86400000;
  assert.equal(parseDraft(JSON.stringify(old)), null);
});
test("backcountry vocabulary is contextual and versioned without requiring factual answers", () => {
  assert.equal(catalog.version, 2);
  assert(searchTypes("chandelier").some((r) => r.type.id === "ice_climbing"));
  assert(searchTypes("coho").some((r) => r.type.id === "fish_activity"));
  assert.doesNotThrow(() => normalizeAnswers(selection, {}));
  assert.throws(() => normalizeAnswers(selection, { fish_species: "coho" }));
  const crossing: Selection = {
    domainId: "outdoors",
    topicId: "outdoors.ice",
    typeId: "river_crossing",
    relatedIds: [],
  };
  assert.throws(() => normalizeAnswers(crossing, { ice_thickness: 20 }));
  assert.doesNotThrow(() =>
    normalizeAnswers(crossing, {
      ice_measurement: "drilled",
      ice_thickness: 20,
    }),
  );
});
