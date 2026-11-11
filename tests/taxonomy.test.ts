import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  validPath,
  normalizeAnswers,
  reconcileAnswers,
  privacyFor,
  publicLocation,
  defaultTitle,
  changeDomain,
  changeTopic,
  legacyPath,
  Selection,
} from "../src/taxonomy";
import { effectiveAssessment } from "../src/assessment";
const path = (
  domainId: Selection["domainId"],
  topicId: string,
  typeId: string,
  relatedIds: string[] = [],
): Selection => ({ domainId, topicId, typeId, relatedIds });
test("catalog has eight domains and valid canonical routes/questions", () => {
  assert.equal(catalog.domains.length, 8);
  assert.ok(Object.keys(catalog.types).length >= 90);
  for (const topic of catalog.topics) {
    assert.ok(catalog.domains.some((d) => d.id === topic.domainId));
    for (const id of topic.typeIds) {
      assert.ok(catalog.types[id]);
      assert.ok(validPath(path(topic.domainId, topic.id, id)));
    }
  }
  for (const type of Object.values(catalog.types))
    for (const key of type.questions) {
      const q = catalog.questions[key];
      assert.ok(q);
      if (q.showWhen) assert.ok(type.questions.includes(q.showWhen.field));
    }
});
test("whiteout cross-links share one event ID and preserve compatible answers", () => {
  const travel = path("travel", "travel.visibility", "whiteout");
  const next = changeDomain(travel, "weather");
  assert.equal(next.typeId, "whiteout");
  assert.equal(next.topicId, "weather.visibility");
  assert.deepEqual(
    reconcileAnswers(next, { visibility: "reduced", animal: "bear" }),
    { visibility: "reduced" },
  );
});
test("path and related-field validation reject tampering and prune hidden answers", () => {
  assert.throws(() =>
    normalizeAnswers(
      path("travel", "wildlife.sighting", "animal_sighting"),
      {},
    ),
  );
  const sighting = path("wildlife", "wildlife.sighting", "animal_sighting");
  assert.throws(() => normalizeAnswers(sighting, { injury: "observed" }));
  assert.throws(() =>
    normalizeAnswers(sighting, {
      animal: "bear",
      other_animal: "Hidden field",
    }),
  );
  assert.deepEqual(
    reconcileAnswers(sighting, {
      animal: "bear",
      other_animal: "Hidden field",
      count: 3,
    }),
    { animal: "bear", count: 3 },
  );
  assert.throws(() => normalizeAnswers(sighting, { count: "not a number" }));
  assert.throws(() => changeTopic(sighting, "travel.surface"));
});
test("sensitive combinations and catch-all routes cannot bypass privacy", () => {
  const sighting = path("wildlife", "wildlife.sighting", "animal_sighting");
  assert.equal(
    privacyFor(sighting, { sighting_behavior: "nesting" }),
    "coarse",
  );
  const related = path("travel", "travel.visibility", "whiteout", [
    "collision",
  ]);
  assert.equal(privacyFor(related, { injury: "observed" }), "restricted");
  assert.equal(
    privacyFor(path("safety", "safety.restricted", "other"), {}),
    "restricted",
  );
  const loc = publicLocation(
    path("safety", "safety.public", "shooting_witnessed"),
    {},
    { name: "Private exact place", latitude: 61.23456, longitude: -149.87654 },
  );
  assert.equal(loc.name, "Regional information");
  assert.equal(loc.latitude, 61);
  assert.equal(loc.longitude, -150);
});
test("titles reflect explicit choices, not inferred outcomes; all legacy paths are valid", () => {
  assert.equal(
    defaultTitle(path("wildlife", "wildlife.sighting", "animal_sighting"), {
      animal: "moose",
    }),
    "Moose sighting",
  );
  assert.match(
    defaultTitle(path("wildlife", "wildlife.encounter", "animal_encounter"), {
      animal: "bear",
      encounter_behavior: "attack",
    }),
    /attack reported/,
  );
  for (const kind of [
    "hazard",
    "road",
    "wildlife",
    "trail",
    "aurora",
    "smoke",
    "flooding",
  ] as const)
    assert.ok(
      validPath(
        legacyPath(
          kind === "road"
            ? "Travel"
            : kind === "wildlife" || kind === "trail" || kind === "aurora"
              ? "Outdoors"
              : "Safety",
          kind,
        ),
      ),
    );
});
test("risk expires independently, disputed/resolved never retain an active danger level, demo cannot forge staff flags", () => {
  const now = Date.now();
  const base = {
    assessment_level: "urgent" as const,
    assessment_state: "active" as const,
    assessment_expires_at: new Date(now + 10000).toISOString(),
  };
  assert.equal(effectiveAssessment(base, now).level, "urgent");
  assert.equal(effectiveAssessment(base, now + 20000).state, "expired");
  assert.equal(
    effectiveAssessment({ ...base, assessment_state: "resolved" }, now).level,
    "none",
  );
  assert.equal(
    effectiveAssessment({ ...base, demo: true }, now).state,
    "not_assessed",
  );
});

test("tile transport classification leaves unrelated style, authorization and application errors visible", async () => {
  const { isTileTransportFailure } = await import("../src/mapHealth");
  assert.equal(
    isTileTransportFailure("Failed to load tile: NSURLErrorDomain error -1005"),
    true,
  );
  assert.equal(
    isTileTransportFailure("tile.opentopomap.org connection timed out"),
    true,
  );
  assert.equal(
    isTileTransportFailure("Map style HTTP 401 unauthorized"),
    false,
  );
  assert.equal(
    isTileTransportFailure("Unexpected text node inside View"),
    false,
  );
});
