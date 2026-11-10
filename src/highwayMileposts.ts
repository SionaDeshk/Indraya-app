import data from "../data/highway-mileposts.json";
import { normalize, type PlaceResult } from "./searchDomain";
export type MilepostSearch =
  | { highway: string; milepost: number; results: PlaceResult[] }
  | { error: string };
/** Resolve only source-published posted numbers; never calculate along-road positions. */
export function highwayMilepostSearch(query: string): MilepostSearch | null {
  const q = normalize(query);
  if (/\bdenali\s+(?:national\s+)?park\b/.test(q)) return null;
  const highway = /\bdalton\b|\bhaul road\b/.test(q)
    ? "Dalton Highway"
    : /\bdenali\s+(?:highway|hwy|mp|mile|milepost)\b/.test(q)
      ? "Denali Highway"
      : null;
  if (!highway) return null;
  const numbers = q.match(/\d+(?:\.\d+)?/g);
  if (!numbers) return null;
  if (
    numbers.length !== 1 ||
    /km|kilomet/.test(q) ||
    /\b(?:mp|milepost|mile)\s*#?\s*-\d/.test(q)
  )
    return {
      error:
        "Search one posted mile number, for example Dalton MP 115. Kilometres and mile ranges are not supported.",
    };
  const match =
    q.match(/\b(?:mp|milepost|mile)\s*#?\s*(\d+(?:\.\d+)?)/) ??
    q.match(/\b(?:dalton|denali)(?:\s+(?:hwy|highway))?\s+(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const milepost = Number(match[1]);
  const results = data.records
    .filter((r) => r.highway === highway && r.milepost === milepost)
    .map((r) => ({
      name: `${highway} MP ${r.milepost}`,
      latitude: r.latitude,
      longitude: r.longitude,
      placeId: `akdot:milepost:${r.id}`,
      provider: "akdot" as const,
      featureType: "milepost",
      focusZoom: 14,
      state: "Alaska",
      countryCode: "US",
      retrievedAt: data.checkedAt,
      coordinateMeaning: "milepost_reference" as const,
      sourceUrl: "https://511.alaska.gov/",
      context: `DOT&PF map reference${r.status === "unknown" ? " · sign status unknown" : ""}${r.collectionYear ? ` · collected ${r.collectionYear}` : ""}`,
    }));
  return { highway, milepost, results };
}
