import type { MapBounds } from "./domain";
import data from "../data/recreation-places.json";
import { normalize, canonicalPlaceQuery, PlaceResult } from "./searchDomain";
export function recreationPlaces(query: string): PlaceResult[] {
  const q = normalize(canonicalPlaceQuery(query));
  if (q.length < 3) return [];
  return data
    .filter((p) => normalize(p.name).includes(q))
    .map((p) => ({
      ...p,
      provider: p.provider as PlaceResult["provider"],
      bounds: p.bounds as MapBounds | undefined,
    }));
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
  const q = normalize(query).replace(/[’']/g, "");
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
  return [];
}
export function mergePlaces(curated: PlaceResult[], live: PlaceResult[]) {
  const rows = [...live];
  for (const p of curated)
    if (!rows.some((r) => p.placeId && r.placeId === p.placeId)) rows.push(p);
  return rows;
}
