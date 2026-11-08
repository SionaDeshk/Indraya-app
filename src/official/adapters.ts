import { FeedId, officialSources } from "./catalog";
export type OfficialItem = {
  id: string;
  feed: FeedId;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  observedAt: string;
  expiresAt?: string;
  geometry: GeoJSON.Geometry | null;
};
export type OfficialFeed = {
  fetchedAt: string;
  generatedAt?: string;
  items: OfficialItem[];
};
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectValue)
    : {};
}
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
function date(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : undefined;
}
function features(body: unknown): unknown[] {
  const root = object(body);
  if (root.type !== "FeatureCollection" || !Array.isArray(root.features))
    throw new Error("Official source returned an unexpected format.");
  return root.features;
}
function trustedUrl(value: unknown, hostname: string, fallback: string) {
  try {
    const url = new URL(text(value));
    return url.protocol === "https:" && url.hostname === hostname
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
}
function position(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}
function ring(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length >= 4 &&
    value.every(position) &&
    value[0][0] === value[value.length - 1][0] &&
    value[0][1] === value[value.length - 1][1]
  );
}
function polygon(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every(ring);
}
function weatherGeometry(value: unknown): GeoJSON.Geometry | null {
  const g = object(value);
  if (g.type === "Polygon" && polygon(g.coordinates))
    return g as unknown as GeoJSON.Polygon;
  if (
    g.type === "MultiPolygon" &&
    Array.isArray(g.coordinates) &&
    g.coordinates.length > 0 &&
    g.coordinates.every(polygon)
  )
    return g as unknown as GeoJSON.MultiPolygon;
  return null;
}
export function parseWeather(body: unknown, now = Date.now()): OfficialItem[] {
  return features(body).flatMap((raw) => {
    const f = object(raw),
      p = object(f.properties);
    const id = text(f.id) || text(p.id);
    const observedAt = date(p.sent),
      expiresAt = date(p.expires);
    if (
      !id ||
      !text(p.event) ||
      !observedAt ||
      !expiresAt ||
      Date.parse(expiresAt) <= now ||
      Date.parse(observedAt) > now ||
      p.status !== "Actual" ||
      p.messageType === "Cancel"
    )
      return [];
    const source = officialSources.weather;
    return [
      {
        id: `nws:${id}`,
        feed: "weather" as const,
        title: text(p.headline) || text(p.event),
        description: [
          text(p.areaDesc),
          text(p.description),
          text(p.instruction),
        ]
          .filter(Boolean)
          .join("\n\n"),
        sourceName: source.name,
        sourceUrl: trustedUrl(p["@id"], "api.weather.gov", source.endpoint),
        observedAt,
        expiresAt,
        geometry: weatherGeometry(f.geometry),
      },
    ];
  });
}
/** Alaska and adjacent waters, including the antimeridian. Regional bounds are not political borders. */
export function inAlaskaRegion(longitude: number, latitude: number) {
  return (
    latitude >= 50 &&
    latitude <= 73 &&
    ((longitude <= -129 && longitude >= -180) ||
      (longitude >= 170 && longitude <= 180))
  );
}
export function parseEarthquakes(
  body: unknown,
  now = Date.now(),
): OfficialItem[] {
  return features(body).flatMap((raw) => {
    const f = object(raw),
      p = object(f.properties),
      g = object(f.geometry);
    const id = text(f.id),
      observedAt = date(p.time);
    if (
      !id ||
      !observedAt ||
      Date.parse(observedAt) < now - 86400000 ||
      Date.parse(observedAt) > now ||
      typeof p.mag !== "number" ||
      !Number.isFinite(p.mag) ||
      p.mag < 2.5 ||
      g.type !== "Point" ||
      !position(g.coordinates) ||
      !inAlaskaRegion(g.coordinates[0], g.coordinates[1])
    )
      return [];
    const source = officialSources.earthquakes;
    return [
      {
        id: `usgs:${id}`,
        feed: "earthquakes" as const,
        title: `M${p.mag.toFixed(1)} · ${text(p.place) || "Alaska region"}`,
        description: `USGS earthquake report. ${text(p.status) === "reviewed" ? "Reviewed by USGS." : "Preliminary; subject to revision."} Regional coverage includes nearby areas and waters. This is not a tsunami warning.`,
        sourceName: source.name,
        sourceUrl: trustedUrl(p.url, "earthquake.usgs.gov", source.website),
        observedAt,
        expiresAt: new Date(Date.parse(observedAt) + 86400000).toISOString(),
        geometry: { type: "Point" as const, coordinates: g.coordinates },
      },
    ];
  });
}
export function currentOfficialItems(
  feed: OfficialFeed | undefined,
  now = Date.now(),
) {
  return (feed?.items ?? []).filter(
    (item) => !item.expiresAt || Date.parse(item.expiresAt) > now,
  );
}
export async function loadOfficialFeed(
  id: FeedId,
  signal?: AbortSignal,
): Promise<OfficialFeed> {
  const source = officialSources[id];
  if (!source.validatedAt)
    throw new Error("This official source is not connected yet.");
  return checkOfficialEndpoint(id, signal);
}
/** Explicit diagnostic only. Not used to bypass the production validation gate. */
export async function checkOfficialEndpoint(
  id: FeedId,
  signal?: AbortSignal,
): Promise<OfficialFeed> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(officialSources[id].endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/geo+json",
        "User-Agent":
          "Indraya/0.1 (+https://github.com/SionaDeshk/Indraya-app)",
      },
    });
    if (!response.ok)
      throw new Error(`Official source unavailable (HTTP ${response.status}).`);
    const body: unknown = await response.json();
    return {
      fetchedAt: new Date().toISOString(),
      generatedAt: date(object(object(body).metadata).generated),
      items: id === "weather" ? parseWeather(body) : parseEarthquakes(body),
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
