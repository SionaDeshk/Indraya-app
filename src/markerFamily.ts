import { Observation, observationDomain } from "./domain";
import { typeById, DomainId } from "./taxonomy";
export function markerFamily(report: Observation): DomainId {
  if (report.event_type_id === "whiteout") return "weather";
  const canonical = typeById(report.event_type_id);
  if (canonical) return canonical.family;
  if (!report.event_type_id) {
    if (report.kind === "smoke") return "environment";
    if (report.kind === "flooding" || report.kind === "aurora")
      return "weather";
    if (
      report.kind === "hazard" ||
      (!report.kind && report.category === "Safety")
    )
      return "safety";
  }
  return observationDomain(report);
}
