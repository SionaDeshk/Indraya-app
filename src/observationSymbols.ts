import manifest from "../data/observation-symbols.json";
import type { Observation } from "./domain";
import { markerFamily } from "./markerFamily";
export const observationSymbols: Record<
  string,
  { symbol: string; label: string }
> = manifest;
export function observationSymbol(report: Observation) {
  const entry = observationSymbols[report.event_type_id ?? ""];
  if (!entry) return { symbol: markerFamily(report), label: "Observation" };
  if (report.event_type_id === "motorized_access") {
    if (report.answers?.vehicle_type === "4x4")
      return { symbol: "event-four-by-four", label: "4×4 access observation" };
    if (["atv", "utv"].includes(String(report.answers?.vehicle_type)))
      return { symbol: "event-atv", label: "ATV / UTV access observation" };
  }
  return entry;
}
