import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  recreationPlaces,
  recreationReferences,
  isTripQuery,
  mergePlaces,
} from "../src/recreationPlaces";
import { highwayMilepostSearch } from "../src/highwayMileposts";
import { placeOutline, placeReferenceCaption } from "../src/placeOutlines";
import { placeSourceUrl } from "../src/placeSources";
const read = (name: string) =>
  JSON.parse(readFileSync(`data/${name}.json`, "utf8"));
test("traverses find huts, real passes and approaches without inventing a glacier route", () => {
  const bomber = recreationPlaces("Bomber Traverse");
  assert.ok(bomber.some((p) => p.name === "Bomber Hut"));
  assert.ok(bomber.some((p) => p.name === "Mint Hut"));
  assert.ok(bomber.some((p) => p.name === "Snowbird Hut"));
  assert.ok(
    recreationPlaces("Bomber loop").some((p) => p.name === "Bomber Hut"),
  );
  assert.ok(
    recreationPlaces("huts in Hatchers Pass").some(
      (p) => p.name === "Mint Hut",
    ),
  );
  assert.equal(recreationPlaces("Bombers Pass")[0].placeId, "osm:N:8600086400");
  const eklutna = recreationPlaces("Eklutna Traverse");
  for (const name of ["Pichler's Perch", "Hans Hut", "Rosie's Roost"])
    assert.ok(
      eklutna.some((p) => p.name === name),
      name,
    );
  assert.ok(!eklutna.some((p) => p.name === "Eklutna Traverse"));
  assert.ok(
    recreationReferences("Eklutna Traverse")[0].url.includes("pichlers-perch"),
  );
});
test("summer/winter route identities and partial mapped segments remain separate", () => {
  const routes = recreationPlaces("ressurection pass");
  const summer = routes.find((p) => p.placeId === "usfs:trail:5075.008121");
  const winter = routes.find((p) => p.placeId === "usfs:trail:291010270");
  assert.ok(summer);
  assert.ok(winter);
  assert.equal(summer.featureType, "hiking_trail");
  assert.equal(winter.featureType, "winter_trail");
  assert.equal(placeOutline(summer)?.geometry.type, "MultiLineString");
  assert.notDeepEqual(
    placeOutline(summer)?.geometry,
    placeOutline(winter)?.geometry,
  );
  assert.match(placeReferenceCaption(summer), /USDA Forest Service/);
  const reed = recreationPlaces("Reed Lakes Trail")[0];
  assert.match(placeReferenceCaption(reed), /Mapped trail segment/);
  assert.equal(placeOutline({ ...reed, placeId: undefined }), undefined);
  assert.equal(placeOutline({ ...summer, privateAddress: true }), undefined);
});
test("cabins, campsites and summer/multiday queries are discoverable with bounded results", () => {
  assert.ok(
    recreationPlaces("summer hikes").some(
      (p) => p.featureType === "hiking_trail",
    ),
  );
  assert.ok(recreationPlaces("multi-day hikes").length > 0);
  assert.ok(
    recreationPlaces("Eagle River yurt").some((p) => p.name === "Yukla Yurt"),
  );
  assert.ok(
    recreationPlaces("Resurrection Pass cabin").some(
      (p) => p.name === "Caribou Creek Cabin",
    ),
  );
  assert.ok(
    recreationPlaces("Dalton campgrounds").some(
      (p) => p.name === "Marion Creek Campground",
    ),
  );
  assert.ok(recreationPlaces("camping").length <= 12);
  assert.ok(isTripQuery("huts Hatcher Pass"));
  assert.ok(!isTripQuery("Girdwood"));
  assert.equal(recreationPlaces("Beluga Cabin").length, 0);
  assert.ok(
    recreationReferences("Beluga Cabin").some((r) =>
      r.url.includes("belugacabin"),
    ),
  );
  assert.equal(recreationPlaces("Scandinavian Peaks Hut").length, 0);
  assert.ok(recreationReferences("Scandinavian Peaks Hut").length > 0);
});
test("Dalton/Denali use posted mile numbers, reject absent positions and do not match Denali Park Road", () => {
  for (const q of [
    "Dalton MP 115",
    "MP 115 Dalton Highway",
    "Dalton 115",
    "Haul Road mile 115",
  ]) {
    const result = highwayMilepostSearch(q);
    assert.ok(result && !("error" in result));
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].name, "Dalton Highway MP 115");
    assert.equal(result.results[0].provider, "akdot");
  }
  const denali = highwayMilepostSearch("Denali hwy mile 104");
  assert.ok(denali && !("error" in denali));
  assert.equal(denali.results[0].name, "Denali Highway MP 104");
  for (const q of [
    "Dalton MP 999",
    "Denali MP 42.5",
    "Denali Highway MP 103.6695364",
  ]) {
    const r = highwayMilepostSearch(q);
    assert.ok(r && !("error" in r));
    assert.equal(r.results.length, 0);
  }
  assert.equal(highwayMilepostSearch("Denali Park Road mile 42"), null);
  for (const q of ["Dalton MP -5", "Denali Highway mile 42km"]) {
    const result = highwayMilepostSearch(q);
    assert.ok(result && "error" in result);
  }
  assert.ok(
    highwayMilepostSearch("Dalton mile 10-20") &&
      "error" in highwayMilepostSearch("Dalton mile 10-20")!,
  );
  assert.ok(
    highwayMilepostSearch("Dalton 10 km") &&
      "error" in highwayMilepostSearch("Dalton 10 km")!,
  );
});
test("published road geometry and route endpoints are retained without adding substitute roads", () => {
  const denali = recreationPlaces("Denali Hwy Cantwell to Paxson")[0];
  assert.equal(denali.placeId, "akdot:route:1120000X000");
  const dalton = recreationPlaces("Dalton Highway")[0];
  assert.equal(dalton.placeId, "akdot:route:1260000X000");
  for (const p of [denali, dalton]) {
    assert.equal(placeOutline(p)?.geometry.type, "MultiLineString");
    assert.ok(p.bounds);
    assert.equal(p.coordinateMeaning, "route_reference");
  }
  assert.ok(
    !recreationPlaces("Dalton Highway").some((p) => p.name === "Dalton Trail"),
  );
});
test("bundled trip datasets contain only validated source facts, not live vacancy/opening claims", () => {
  const places = read("trip-places"),
    geometries = read("route-geometries"),
    miles = read("highway-mileposts");
  assert.equal(places.length, 119);
  assert.equal(geometries.features.length, 31);
  assert.equal(miles.records.length, 459);
  assert.equal(
    new Set(places.map((p: { placeId: string }) => p.placeId)).size,
    places.length,
  );
  for (const p of places) {
    assert.ok(Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    assert.ok(p.latitude >= 51 && p.latitude <= 72);
    assert.ok(placeSourceUrl(p));
    assert.ok(!("openstatus" in p));
    assert.ok(!("availability" in p));
  }
  const keys = new Set();
  for (const r of miles.records) {
    const key = `${r.highway}:${r.milepost}`;
    assert.ok(!keys.has(key));
    keys.add(key);
    assert.ok(["active", "unknown"].includes(r.status));
  }
  for (const feature of geometries.features) {
    assert.equal(feature.geometry.type, "MultiLineString");
    for (const path of feature.geometry.coordinates) {
      assert.ok(path.length >= 2);
      for (const [x, y] of path) {
        assert.ok(
          Number.isFinite(x) &&
            Number.isFinite(y) &&
            x >= -180 &&
            x <= -129.9 &&
            y >= 51 &&
            y <= 72,
        );
      }
    }
  }
});
test("operator sources survive deduplication and untrusted links cannot be opened", () => {
  const hut = recreationPlaces("Mint Hut")[0];
  const combined = mergePlaces(
    [hut],
    [{ ...hut, sourceUrl: undefined, context: "Live geocoder row" }],
  );
  assert.equal(combined.length, 1);
  assert.ok(combined[0].sourceUrl?.includes("mtnclubak"));
  assert.ok(placeSourceUrl(hut));
  for (const sourceUrl of [
    "javascript:alert(1)",
    "https://www.mtnclubak.org.evil.test/huts",
    "https://user:password@www.mtnclubak.org/huts",
    "http://www.mtnclubak.org/huts",
  ])
    assert.equal(placeSourceUrl({ ...hut, sourceUrl }), undefined);
});
