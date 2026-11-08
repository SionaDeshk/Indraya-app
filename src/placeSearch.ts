import AsyncStorage from "@react-native-async-storage/async-storage";
export { savedPlaces } from "./searchDomain";
export type { PlaceResult } from "./searchDomain";
import { normalize, parsePhoton, PlaceResult } from "./searchDomain";
let lastRequest = 0;
export async function searchPlaces(
  query: string,
  focus: [number, number],
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 3 || q.length > 160)
    throw Error("Enter 3–160 characters to search.");
  const lon = Math.round(focus[0] * 10) / 10,
    lat = Math.round(focus[1] * 10) / 10;
  const key = `indraya.search.v1:${normalize(q)}:${lon}:${lat}`;
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.time < 86400000 && Array.isArray(data.results))
        return data.results;
    } catch {
      /* Ignore a damaged local search cache. */
    }
  }
  if (Date.now() - lastRequest < 1100)
    throw Error("Please wait a moment before searching again.");
  lastRequest = Date.now();
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 12000);
  try {
    const params = new URLSearchParams({
      q,
      limit: "8",
      lat: String(lat),
      lon: String(lon),
      lang: "en",
    });
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok)
      throw Error(
        `Online place search is unavailable (${response.status}). Saved places still work.`,
      );
    const results = parsePhoton(await response.json());
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ time: Date.now(), results }),
    );
    return results;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
