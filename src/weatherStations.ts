import { fetchWithTimeout } from "./requestTimeout";
import { inAlaskaSearchRegion } from "./searchDomain";
type Obj = Record<string, unknown>;
const object = (v: unknown): Obj =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
export function nwsURL(value: unknown) {
  if (typeof value !== "string") throw Error("Invalid NWS link");
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "api.weather.gov" ||
    u.port ||
    u.username ||
    u.password ||
    !/^\/(points|stations|gridpoints)\//.test(u.pathname)
  )
    throw Error("Invalid NWS link");
  return u.href;
}
export function windMph(value: unknown) {
  const m = object(value),
    factors: Record<string, number> = {
      "wmoUnit:km_h-1": 0.6213711922,
      "wmoUnit:m_s-1": 2.2369362921,
      "wmoUnit:kn": 1.150779448,
    };
  const factor =
    typeof m.unitCode === "string" ? factors[m.unitCode] : undefined;
  return typeof m.value === "number" &&
    Number.isFinite(m.value) &&
    m.value >= 0 &&
    factor &&
    m.qualityControl !== "Z"
    ? Math.round(m.value * factor)
    : null;
}
export function stationReading(body: unknown, now = Date.now()) {
  const p = object(object(body).properties),
    at =
      typeof p.timestamp === "string" &&
      /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(p.timestamp)
        ? Date.parse(p.timestamp)
        : NaN;
  if (!Number.isFinite(at) || at > now + 300000)
    throw Error("Station reading time unavailable");
  const t = object(p.temperature);
  return {
    observedAt: new Date(at).toISOString(),
    wind: windMph(p.windSpeed),
    gust: windMph(p.windGust),
    temperature:
      typeof t.value === "number" &&
      Number.isFinite(t.value) &&
      t.unitCode === "wmoUnit:degC" &&
      t.qualityControl !== "Z"
        ? Math.round((t.value * 9) / 5 + 32)
        : null,
  };
}
export function distanceKm(a: [number, number], b: [number, number]) {
  const [lon1, lat1, lon2, lat2] = [...a, ...b].map((v) => (v * Math.PI) / 180);
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
async function get(url: string, signal?: AbortSignal) {
  const response = await fetchWithTimeout(nwsURL(url), {
    signal,
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "Indraya (https://github.com/SionaDeshk/Indraya-app)",
    },
  });
  if (!response.ok)
    throw Error(
      response.status === 429
        ? "NWS is busy. Try again later."
        : "NWS station unavailable. Try again later.",
    );
  if (response.url) nwsURL(response.url);
  const length = Number(response.headers.get("content-length"));
  if (length > 2000000) throw Error("Unexpected NWS response");
  const raw = await response.text();
  if (raw.length > 2000000) throw Error("Unexpected NWS response");
  return object(JSON.parse(raw));
}
/** Only call after explicit expansion for a public approximate observation. No device GPS. */
export async function nearbyStation(
  longitude: number,
  latitude: number,
  signal?: AbortSignal,
) {
  if (!inAlaskaSearchRegion(longitude, latitude))
    throw Error("Alaska station coverage unavailable");
  const x = Math.round(longitude * 100) / 100,
    y = Math.round(latitude * 100) / 100;
  const point = object(
    (
      await get(
        `https://api.weather.gov/points/${y.toFixed(2)},${x.toFixed(2)}`,
        signal,
      )
    ).properties,
  );
  if (object(object(point.relativeLocation).properties).state !== "AK")
    throw Error("Alaska station coverage unavailable");
  const collection = await get(nwsURL(point.observationStations), signal);
  if (
    collection.type !== "FeatureCollection" ||
    !Array.isArray(collection.features)
  )
    throw Error("Station discovery unavailable");
  const candidates = collection.features
    .slice(0, 200)
    .flatMap((value) => {
      const f = object(value),
        p = object(f.properties),
        g = object(f.geometry),
        c = g.coordinates;
      if (
        g.type !== "Point" ||
        !Array.isArray(c) ||
        typeof c[0] !== "number" ||
        typeof c[1] !== "number" ||
        !inAlaskaSearchRegion(c[0], c[1]) ||
        typeof p.name !== "string" ||
        !p.name
      )
        return [];
      let url: string;
      try {
        url = nwsURL(p["@id"] ?? f.id);
      } catch {
        return [];
      }
      if (!/^https:\/\/api.weather.gov\/stations\/[A-Za-z0-9_-]+$/.test(url))
        return [];
      return [
        {
          name: p.name.slice(0, 160),
          url,
          distance: distanceKm([x, y], [c[0], c[1]]),
          elevation: object(p.elevation),
        },
      ];
    })
    .sort((a, b) => a.distance - b.distance);
  const station = candidates[0];
  if (!station || station.distance > 100)
    throw Error("No nearby NWS station found. Check the official forecast.");
  const reading = stationReading(
    await get(`${station.url}/observations/latest`, signal),
  );
  return {
    name: station.name,
    stationUrl: station.url,
    distance: Math.round(station.distance),
    elevation:
      typeof station.elevation.value === "number" &&
      Number.isFinite(station.elevation.value) &&
      station.elevation.unitCode === "wmoUnit:m"
        ? Math.round(station.elevation.value)
        : null,
    ...reading,
    fetchedAt: new Date().toISOString(),
  };
}
