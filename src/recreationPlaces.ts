import type { MapBounds } from "./domain";
import data from "../data/recreation-places.json";
import tripData from "../data/trip-places.json";
import references from "../data/trip-references.json";
import { normalize, canonicalPlaceQuery, PlaceResult } from "./searchDomain";
export type SavedPlace = PlaceResult & { searchTerms?: string[] };
const savedPlaces = [...data, ...tripData] as unknown as SavedPlace[];
const singular: Record<string, string> = {
  hatchers: "hatcher",
  bombers: "bomber",
  huts: "hut",
  cabins: "cabin",
  yurts: "yurt",
  traverses: "traverse",
  hikes: "hike",
  hiking: "hike",
  skiing: "ski",
  skis: "ski",
  campgrounds: "camp",
  campground: "camp",
  campsites: "camp",
  campsite: "camp",
  camping: "camp",
  trails: "trail",
  loops: "loop",
  multiday: "multiday",
};
function tokens(value: string) {
  return normalize(value)
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(
      (t) => t && !["the", "and", "of", "to", "in", "near", "at"].includes(t),
    )
    .map((t) => singular[t] ?? t);
}
export function recreationPlaces(
  query: string,
  focus?: [number, number],
): PlaceResult[] {
  const q = normalize(canonicalPlaceQuery(query));
  if (q.length < 3) return [];
  const words = tokens(q);
  const score = (p: SavedPlace) => {
    const name = normalize(p.name);
    return name === q
      ? 100
      : name.startsWith(q)
        ? 80
        : name.includes(q)
          ? 60
          : 20;
  };
  const distance = (p: SavedPlace) =>
    focus
      ? ((p.longitude - focus[0]) * Math.cos((focus[1] * Math.PI) / 180)) ** 2 +
        (p.latitude - focus[1]) ** 2
      : 0;
  const matches = savedPlaces.filter((p) => {
    const index = tokens(
      [p.name, p.context ?? "", ...(p.searchTerms ?? [])].join(" "),
    );
    return (
      words.length > 0 &&
      words.every((w) =>
        index.some((t) => t === w || (w.length >= 4 && t.startsWith(w))),
      )
    );
  });
  const hasExact = matches.some((p) => normalize(p.name) === q);
  return matches
    .filter((p) => !hasExact || normalize(p.name).startsWith(q))
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        distance(a) - distance(b) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 12)
    .map((p) => ({ ...p, bounds: p.bounds as MapBounds | undefined }));
}
export function isTripQuery(query: string) {
  return tokens(query).some((t) =>
    [
      "hut",
      "cabin",
      "yurt",
      "camp",
      "traverse",
      "trail",
      "hike",
      "loop",
      "multiday",
      "highway",
    ].includes(t),
  );
}
export function recreationReferences(query: string) {
  if (
    /^(?:alaska )?(?:ski lines|ski routes|powder project)$/i.test(query.trim())
  )
    return [
      {
        label: "Alaska ski lines · Powder Project",
        url: "https://www.powderproject.com/search?q=alaska",
      },
    ];
  if (
    /^(?:south ?central alaska ice(?: and alpine)?|alaska ice climbs)$/i.test(
      query.trim(),
    )
  )
    return [
      {
        label: "South Central Alaska ice & alpine · Mountain Project",
        url: "https://www.mountainproject.com/area/105909315/south-central-alaska-ice-and-alpine",
      },
    ];
  const q = normalize(canonicalPlaceQuery(query)).replace(/[’']/g, "");
  if (/\bbeer(s)?\b/.test(q))
    return [
      {
        label: "Beer Climbs · Mountain Project route reference",
        url: "https://www.mountainproject.com/area/111518793/beer-climbs",
      },
    ];
  if (/kids? corner/.test(q))
    return [
      {
        label: "Kid’s Corner · Alaska Ice Climbing reference",
        url: "https://alaskaiceclimbing.com/kids-corner/",
      },
    ];
  if (/seatt?les? ridge|backcountry ski/.test(q))
    return [
      {
        label: "Joe Stock · The Alaska Factor reference",
        url: "https://www.stockalpine.com/the-alaska-factor",
      },
    ];
  const words = tokens(q);
  return references
    .filter((r) =>
      r.searchTerms.some((term) => {
        const index = tokens(term);
        return words.length > 0 && words.every((w) => index.includes(w));
      }),
    )
    .slice(0, 3)
    .map((r) => ({ label: r.label, url: r.url }));
}
export function mergePlaces(curated: PlaceResult[], live: PlaceResult[]) {
  // Reviewed entries retain their operator links, geometry bounds and point meaning.
  // A matching live geocoder row must not silently discard that information.
  return [
    ...curated,
    ...live.filter(
      (p) => !curated.some((c) => p.placeId && c.placeId === p.placeId),
    ),
  ];
}
