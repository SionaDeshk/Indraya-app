import data from "../data/recreation-places.json";
import { normalize, PlaceResult } from "./searchDomain";
export function recreationPlaces(query: string): PlaceResult[] {
  const q = normalize(query);
  if (q.length < 3) return [];
  return data
    .filter((p) => normalize(p.name).includes(q))
    .map((p) => ({ ...p, provider: "photon" as const }));
}
export function recreationReferences(query: string) {
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
