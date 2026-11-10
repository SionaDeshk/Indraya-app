import type { ReportLocation, MapBounds } from "./domain";
export type PlaceResult = ReportLocation & {
  provider: "photon" | "nominatim" | "gnis";
  retrievedAt?: string;
  state?: string;
  countryCode?: string;
};
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
/** Common local spellings; never merge a resort, summit and pass into one place. */
export function canonicalPlaceQuery(value: string) {
  const aliases: Record<string, string> = {
    "alyeska mountain": "Mount Alyeska",
    "hatchers pass": "Hatcher Pass",
    "hatcher pass area": "Hatcher Pass Public Use Area",
    "hatchers pass area": "Hatcher Pass Public Use Area",
    "ekluta lake": "Eklutna Lake",
    "seattles ridge": "Seattle Ridge",
  };
  return aliases[normalize(value)] ?? value.trim();
}
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
      placeId:
        /^[NWR]$/.test(String(p.osm_type)) &&
        Number.isSafeInteger(p.osm_id) &&
        Number(p.osm_id) > 0
          ? `osm:${p.osm_type}:${p.osm_id}`
          : undefined,
      state: clean(p.state),
      countryCode: clean(p.countrycode).toUpperCase(),
      privateAddress:
        (!clean(p.name) && !!street) ||
        ["house", "residential", "apartments"].includes(featureType),
    };
    if (
      !result.some(
        (r) =>
          (item.placeId && r.placeId === item.placeId) ||
          (!item.placeId &&
            !r.placeId &&
            r.name === name &&
            r.featureType === featureType &&
            r.context === context &&
            r.latitude === lat &&
            r.longitude === lon),
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

/** Geographic envelope is a guard, not a political boundary. Provider admin metadata is checked separately. */
export function inAlaskaSearchRegion(longitude: number, latitude: number) {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    latitude >= 51 &&
    latitude <= 72 &&
    ((longitude >= -180 && longitude <= -129.9) ||
      (longitude >= 170 && longitude <= 180))
  );
}
export function alaskaPlaces(results: PlaceResult[]) {
  return results
    .filter((place) => {
      const state = normalize(place.state ?? ""),
        country = (place.countryCode ?? "").toUpperCase();
      if (!inAlaskaSearchRegion(place.longitude, place.latitude)) return false;
      if (state && !["alaska", "ak", "us-ak"].includes(state)) return false;
      if (country && country !== "US") return false;
      return !!state || country === "US";
    })
    .map((place) => {
      // Do not fit a remote/overbroad provider extent simply because its point was in Alaska.
      const b = place.bounds;
      const width = b ? (b[2] - b[0] + 360) % 360 : 0;
      const bounds =
        b &&
        width <= 65 &&
        inAlaskaSearchRegion(b[0], b[1]) &&
        inAlaskaSearchRegion(b[2], b[3])
          ? b
          : undefined;
      return { ...place, bounds };
    });
}

/** Prefer the geographic place over same-name transit stops, without discarding them. */
export function rankPlaces(
  results: PlaceResult[],
  query: string,
): PlaceResult[] {
  const q = normalize(canonicalPlaceQuery(query));
  const score = (p: PlaceResult) => {
    const n = normalize(p.name);
    const geographic = [
      "city",
      "town",
      "village",
      "hamlet",
      "lake",
      "bay",
      "peak",
      "mountain_pass",
    ].includes(p.featureType ?? "");
    return (n === q ? 100 : n.startsWith(q) ? 50 : 0) + (geographic ? 10 : 0);
  };
  return [...results].sort((a, b) => score(b) - score(a));
}
export function initialPlaceCount(results: PlaceResult[], query: string) {
  const first = results[0];
  return first &&
    normalize(first.name) === normalize(canonicalPlaceQuery(query)) &&
    ["city", "town", "village", "hamlet", "lake", "bay"].includes(
      first.featureType ?? "",
    ) &&
    !results
      .slice(1)
      .some(
        (p) =>
          normalize(p.name) === normalize(canonicalPlaceQuery(query)) &&
          p.featureType === first.featureType,
      )
    ? 1
    : 3;
}
