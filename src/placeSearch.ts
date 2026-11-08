import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const key = `indraya.search.v2:${normalize(q)}:${lon}:${lat}`;
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.time;
      if (
        age >= 0 &&
        age < 86400000 &&
        Array.isArray(data.results) &&
        data.results.every(
          (p: PlaceResult) =>
            p.provider === "photon" &&
            Number.isFinite(p.latitude) &&
            Number.isFinite(p.longitude),
        )
      )
        return data.results;
    }
  } catch {
    /* Cache is optional and never substitutes an invented result. */
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
    if (response.status === 429)
      throw Error("Search is busy. Wait a moment and try again.");
    if (!response.ok)
      throw Error(
        "Unable to search right now. Check your connection and try again.",
      );
    const results = parsePhoton(await response.json()).map((p) => ({
      ...p,
      retrievedAt: new Date().toISOString(),
    }));
    if (controller.signal.aborted)
      throw new DOMException("Cancelled", "AbortError");
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ time: Date.now(), results }),
      );
    } catch {
      /* A full cache must not discard a successful search. */
    }
    return results;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw Error("Search took too long. Please try again.");
    throw error instanceof Error && error.message.startsWith("Search is busy")
      ? error
      : error instanceof Error &&
          /place|locations|results|search/i.test(error.message)
        ? error
        : Error(
            "Unable to search right now. Check your connection and try again.",
          );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
