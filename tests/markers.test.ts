import { test } from "node:test";
import assert from "node:assert/strict";
import { markerFamily } from "../src/markerFamily";
import { Observation } from "../src/domain";
const report = {
  category: "Travel",
  kind: "road",
  title: "Fixture",
  id: "fixture",
} as Observation;
test("marker symbols describe the event independently from staff danger grades", () => {
  assert.equal(
    markerFamily({ ...report, event_type_id: "whiteout", domain_id: "travel" }),
    "weather",
  );
  assert.equal(
    markerFamily({ ...report, category: "Outdoors", kind: "wildlife" }),
    "wildlife",
  );
  assert.equal(
    markerFamily({ ...report, category: "Safety", kind: "smoke" }),
    "environment",
  );
  assert.equal(
    markerFamily({ ...report, category: "Safety", kind: "hazard" }),
    "safety",
  );
  assert.equal(
    markerFamily({ ...report, assessment_level: "urgent" }),
    "travel",
  );
  assert.equal(
    markerFamily({ ...report, event_type_id: "smoke", domain_id: "safety" }),
    "environment",
  );
});
