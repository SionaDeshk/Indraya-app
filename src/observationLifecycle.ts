import type { Observation } from "./domain";
import { typeById } from "./taxonomy";
const hour = 3600000;
export function lifetimeHours(type?: string) {
  const configured = typeById(type)?.ttlHours;
  if (configured) return configured;
  if (
    [
      "whiteout",
      "fog",
      "blowing_snow",
      "strong_wind",
      "animal_sighting",
      "fish_activity",
    ].includes(type ?? "")
  )
    return 6;
  if (
    ["avalanche", "slide_debris", "carcass", "animal_signs"].includes(
      type ?? "",
    )
  )
    return 72;
  if (
    ["washout", "damaged_trail", "blocked_access", "damaged_bridge"].includes(
      type ?? "",
    )
  )
    return 168;
  return 24;
}
export function expiresAt(
  report: Pick<Observation, "observed_at" | "created_at" | "event_type_id"> & {
    expires_at?: string;
  },
) {
  if (report.expires_at) return report.expires_at;
  const observed = Date.parse(report.observed_at ?? report.created_at);
  return Number.isFinite(observed)
    ? new Date(
        observed + lifetimeHours(report.event_type_id) * hour,
      ).toISOString()
    : "";
}
export function isActive(report: Observation, now: number) {
  const expiry = Date.parse(expiresAt(report));
  return Number.isFinite(expiry) && expiry > now;
}
export function observationStatus(report: Observation, now: number) {
  if (report.status === "review")
    return {
      label: "Awaiting review",
      explanation: "Private. This observation is not on the public map yet.",
    };
  if (report.status === "hidden")
    return {
      label: "Hidden",
      explanation: "Removed from public view by moderation.",
    };
  if (!isActive(report, now))
    return {
      label: "Outdated",
      explanation:
        "No longer on the active map. This does not mean conditions have improved.",
    };
  return {
    label: "Shared",
    explanation: "Visible as an unverified community observation.",
  };
}
