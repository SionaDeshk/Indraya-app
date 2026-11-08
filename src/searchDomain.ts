import type { ReportLocation, MapBounds } from "./domain";
export type PlaceResult = ReportLocation & {
  provider: "photon";
  retrievedAt?: string;
};
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
const clean = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f]/g, " ")
        .trim()
        .slice(0, 240)
    : "";
function extent(value: unknown): MapBounds | undefined {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every((n) => typeof n === "number" && Number.isFinite(n))
  )
    return;
  const [w, n, e, s] = value;
  if (
    Math.abs(w) > 180 ||
    Math.abs(e) > 180 ||
    Math.abs(n) > 90 ||
    Math.abs(s) > 90 ||
    w === e ||
    n === s
  )
    return;
  // Photon documents W,N,E,S; normalize latitude order without losing antimeridian crossing.
  return [w, Math.min(n, s), e, Math.max(n, s)];
}
export function parsePhoton(body: unknown): PlaceResult[] {
  if (
    !body ||
    typeof body !== "object" ||
    ("type" in body && body.type !== "FeatureCollection") ||
    !("features" in body) ||
    !Array.isArray(body.features)
  )
    throw Error("Unable to read these place results. Please try again.");
  const result: PlaceResult[] = [];
  for (const value of body.features.slice(0, 50)) {
    if (!value || typeof value !== "object") continue;
    const { properties: p, geometry: g } = value as {
      properties?: Record<string, unknown>;
      geometry?: { type?: string; coordinates?: unknown[] };
    };
    if (!p || g?.type !== "Point" || !Array.isArray(g.coordinates)) continue;
    const [lon, lat] = g.coordinates;
    if (
      typeof lon !== "number" ||
      typeof lat !== "number" ||
      !Number.isFinite(lon) ||
      !Number.isFinite(lat) ||
      Math.abs(lon) > 180 ||
      Math.abs(lat) > 90
    )
      continue;
    const street = [clean(p.housenumber), clean(p.street)]
      .filter(Boolean)
      .join(" ");
    const name = clean(p.name) || street;
    if (!name) continue;
    const featureType = clean(p.osm_value) || clean(p.type) || "place";
    const context = [
      street && street !== name ? street : "",
      clean(p.city) || clean(p.district),
      clean(p.state),
      clean(p.country),
    ]
      .filter(Boolean)
      .filter((part, i, all) => all.indexOf(part) === i)
      .join(", ");
    const bounds = extent(p.extent);
    const focusZoom = ["city", "town"].includes(featureType)
      ? 10
      : [
            "village",
            "locality",
            "hamlet",
            "glacier",
            "lake",
            "peak",
            "river",
            "park",
            "nature_reserve",
          ].includes(featureType)
        ? 12
        : 15;
    const item: PlaceResult = {
      name,
      longitude: lon,
      latitude: lat,
      context,
      featureType,
      bounds,
      focusZoom,
      provider: "photon",
      privateAddress:
        (!clean(p.name) && !!street) ||
        ["house", "residential", "apartments"].includes(featureType),
    };
    if (
      !result.some(
        (r) =>
          r.name === name &&
          Math.abs(r.latitude - lat) < 0.001 &&
          Math.abs(r.longitude - lon) < 0.001,
      )
    )
      result.push(item);
  }
  if (body.features.length > 0 && result.length === 0)
    throw Error(
      "These place results have no valid locations. Please try another search.",
    );
  return result.slice(0, 8);
}
