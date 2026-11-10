export type AssessmentLevel = "none" | "caution" | "hazard" | "urgent";
export type AssessmentState =
  "not_assessed" | "active" | "expired" | "resolved" | "disputed";
export type PublicAssessment = {
  assessment_level?: AssessmentLevel;
  assessment_state?: AssessmentState;
  assessed_at?: string | null;
  assessment_expires_at?: string | null;
  assessment_note?: string | null;
  demo?: boolean;
};
export const riskPresentation = {
  none: { label: "Not assessed", color: "#b3c8c8" },
  caution: { label: "Moderator caution note", color: "#e7ce78" },
  hazard: { label: "Moderator hazard note", color: "#ffa561" },
  urgent: { label: "Moderator urgent note", color: "#f4767e" },
} as const;
export function effectiveAssessment(
  report: PublicAssessment,
  now = Date.now(),
) {
  if (report.demo)
    return {
      level: "none" as AssessmentLevel,
      state: "not_assessed" as AssessmentState,
    };
  const state = report.assessment_state ?? "not_assessed",
    level = report.assessment_level ?? "none";
  if (state !== "active") return { level: "none" as AssessmentLevel, state };
  const expiry = Date.parse(report.assessment_expires_at ?? "");
  if (!Number.isFinite(expiry) || expiry <= now)
    return {
      level: "none" as AssessmentLevel,
      state: "expired" as AssessmentState,
    };
  return { level, state };
}
