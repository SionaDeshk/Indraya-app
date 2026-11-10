import type { ReportLocation } from "./domain";
const hosts = new Set([
  "www.openstreetmap.org",
  "www.mtnclubak.org",
  "americanalpineclub.org",
  "www.ernc.org",
  "dnr.alaska.gov",
  "www.blm.gov",
  "www.fs.usda.gov",
  "www.arcgis.com",
  "511.alaska.gov",
  "www.recreation.gov",
  "www.adfg.alaska.gov",
]);
export function placeSourceUrl(place: ReportLocation) {
  try {
    const u = new URL(place.sourceUrl ?? "");
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      hosts.has(u.hostname)
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
