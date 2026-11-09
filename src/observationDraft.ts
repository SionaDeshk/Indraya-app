import {
  Answers,
  Selection,
  validPath,
  normalizeAnswers,
  publicLocation,
} from "./taxonomy";
import { validRequestId, type SubmissionAttempt } from "./submission";
import { normalizeExtent } from "./observationExtent";
import type { ReportLocation } from "./domain";
export type ObservationDraft = {
  selection: Selection;
  answers: Answers;
  title: string;
  titleEdited: boolean;
  description: string;
  location: ReportLocation | null;
  observedAt: string | null;
  attempt?: SubmissionAttempt | null;
};
export function parseDraft(raw: string | null): ObservationDraft | null {
  try {
    const d = JSON.parse(raw ?? "null");
    if (
      !d ||
      d.version !== 1 ||
      !Number.isFinite(d.updatedAt) ||
      (Date.now() - d.updatedAt > 7 * 86400000 && !d.value?.attempt) ||
      !validPath(d.value.selection)
    )
      return null;
    const v = d.value;
    if (
      typeof v.titleEdited !== "boolean" ||
      typeof v.title !== "string" ||
      v.title.length > 100 ||
      typeof v.description !== "string" ||
      v.description.length > 2000 ||
      (v.observedAt !== null && !Number.isFinite(Date.parse(v.observedAt)))
    )
      return null;
    if (v.observedAt === null)
      v.observedAt = new Date(d.updatedAt).toISOString();
    v.answers = normalizeAnswers(v.selection, v.answers);
    if (v.location) {
      if (
        !Number.isFinite(v.location.latitude) ||
        !Number.isFinite(v.location.longitude) ||
        Math.abs(v.location.latitude) > 90 ||
        Math.abs(v.location.longitude) > 180
      )
        return null;
      v.location = publicLocation(v.selection, v.answers, {
        ...v.location,
        name: v.location.privateAddress
          ? "Approximate map area"
          : v.location.name,
      });
    }
    if (v.attempt) {
      if (
        !validRequestId(v.attempt.requestId) ||
        !v.location ||
        !Number.isFinite(Date.parse(v.attempt.observedAt))
      )
        return null;
      v.attempt.extent = normalizeExtent(
        v.attempt.extent,
        v.selection.typeId,
        v.location.privacy ?? "approximate",
        v.location.latitude,
        v.location.longitude,
      );
      v.observedAt = v.attempt.observedAt;
    }
    return v;
  } catch {
    return null;
  }
}
