import routes from "../data/route-geometries.json";
import data from "../data/place-outlines.json";
import type { ReportLocation } from "./domain";
/** Identity-matched reference geometry only; never derive an outline from a bounding box. */
export function placeOutline(
  place?: ReportLocation | null,
): GeoJSON.Feature | undefined {
  if (!place || place.privateAddress || !place.placeId) return;
  const item =
    data.features.find((f) => f.properties.placeId === place.placeId) ??
    routes.features.find((f) => f.properties.placeId === place.placeId);
  return item as GeoJSON.Feature | undefined;
}

export function placeReferenceCaption(place: ReportLocation) {
  const feature = placeOutline(place);
  if (
    feature &&
    ["LineString", "MultiLineString"].includes(feature.geometry.type)
  ) {
    const route = routes.features.find(
      (f) => f.properties.placeId === place.placeId,
    );
    return `${route?.properties.referenceKind === "segment" ? "Mapped trail segment" : "Mapped route"} · ${route?.properties.attribution ?? "Source reference"}`;
  }
  if (feature) return "Mapped outline · © OpenStreetMap contributors";
  if (place.coordinateMeaning === "milepost_reference")
    return place.context?.includes("sign status unknown")
      ? "Sign status unknown · DOT&PF reference"
      : "Mapped milepost · Alaska DOT&PF";
  if (place.coordinateMeaning === "site_reference")
    return "Mapped site · check operator access and reservations";
  return "Place pin · mapped outline unavailable";
}
