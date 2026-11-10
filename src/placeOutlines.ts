import data from "../data/place-outlines.json";
import type { ReportLocation } from "./domain";
/** Identity-matched reference geometry only; never derive an outline from a bounding box. */
export function placeOutline(
  place?: ReportLocation | null,
): GeoJSON.Feature | undefined {
  if (!place || place.privateAddress || !place.placeId) return;
  const item = data.features.find(
    (f) => f.properties.placeId === place.placeId,
  );
  return item as GeoJSON.Feature | undefined;
}
