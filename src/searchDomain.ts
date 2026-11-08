import { places, ReportLocation } from "./domain";
export type PlaceResult = ReportLocation & {
  context?: string;
  provider?: "saved" | "photon";
};
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function savedPlaces(query: string): PlaceResult[] {
  const q = normalize(query);
  return q
    ? places
        .filter((p) => normalize(p.name).includes(q))
        .map((p) => ({ ...p, provider: "saved" }))
    : [];
}
export function parsePhoton(body: unknown): PlaceResult[] {
  if (
    !body ||
    typeof body !== "object" ||
    !("type" in body) ||
    body.type !== "FeatureCollection" ||
    !("features" in body) ||
    !Array.isArray(body.features)
  )
    throw Error("Place search returned an unexpected response.");
  const result: PlaceResult[] = [];
  for (const value of body.features) {
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
    const name =
      typeof p.name === "string"
        ? p.name
        : typeof p.street === "string"
          ? p.street
          : "";
    if (!name) continue;
    const context = [p.city, p.state, p.country]
      .filter((v) => typeof v === "string")
      .join(", ");
    const item: PlaceResult = {
      name,
      longitude: lon,
      latitude: lat,
      context,
      provider: "photon",
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
  return result.slice(0, 8);
}
