import type { Selection, Answers } from "./taxonomy";
import type { ReportLocation } from "./domain";
import type { ObservationExtent } from "./observationExtent";
export type GuidedReportInput = {
  selection: Selection;
  answers: Answers;
  title: string;
  description: string;
  location: ReportLocation;
  observed_at: string;
  extent?: ObservationExtent | null;
};
export type SubmissionAttempt = {
  requestId: string;
  observedAt: string;
  extent: ObservationExtent | null;
};
export const validRequestId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
export function newRequestId() {
  // A deduplication key, never an authentication secret. No new native module.
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const n = Math.floor(Math.random() * 16);
    return (c === "x" ? n : (n & 3) | 8).toString(16);
  });
}
