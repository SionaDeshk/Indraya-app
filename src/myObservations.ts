import type { Observation } from "./domain";
export const EDIT_WINDOW_MS = 10 * 60 * 1000;
export function newestFirst(rows: Observation[]) {
  return [...rows].sort(
    (a, b) =>
      Date.parse(b.created_at) - Date.parse(a.created_at) ||
      b.id.localeCompare(a.id),
  );
}
export function editTimeLeft(report: Observation, now = Date.now()) {
  const created = Date.parse(report.created_at);
  if (
    !Number.isFinite(created) ||
    created > now ||
    report.verification === "reviewed" ||
    (report.status && report.status !== "published") ||
    (report.assessment_state && report.assessment_state !== "not_assessed") ||
    Object.values(report.response_summary ?? {}).some(
      (v) => typeof v === "number" && v > 0,
    )
  )
    return 0;
  return Math.max(0, created + EDIT_WINDOW_MS - now);
}
