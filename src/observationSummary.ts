import type { Observation } from "./domain";
import { catalog, answerLabel } from "./taxonomy";
export function summaryFacts(report: Observation) {
  const facts = Object.entries(report.answers ?? {})
    .filter(
      ([, value]) => value !== "unknown" && value !== "" && value !== null,
    )
    .sort(
      ([a], [b]) =>
        Number(b === "ice_measurement") - Number(a === "ice_measurement"),
    )
    .map(([key, value]) => {
      const field = catalog.questions[key];
      if (!field) return null;
      if (key === "ice_measurement" && value === "not_measured")
        return "Thickness not measured";
      if (key === "ice_texture")
        return `Ice: ${answerLabel(field, value).split(" · ")[0]}`;
      if (key === "water_context") return answerLabel(field, value);
      return `${field.label.replace(/\s*[·?].*$/, "")}: ${answerLabel(field, value)}`;
    })
    .filter((value): value is string => !!value);
  return facts.slice(0, 3);
}
