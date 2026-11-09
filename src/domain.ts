import {
  Answers,
  PrivacyClass,
  DomainId,
  typeById,
  legacyPath,
} from "./taxonomy";
import { PublicAssessment } from "./assessment";
export type ReportLocation = {
  name: string;
  latitude: number;
  longitude: number;
  bounds?: MapBounds;
  focusZoom?: number;
  featureType?: string;
  context?: string;
  reference_name?: string;
  privateAddress?: boolean;
};
export type Category = "Safety" | "Outdoors" | "Travel";
export type Observation = PublicAssessment & {
  id: string;
  category: Category;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  created_at: string;
  verification: "unverified" | "reviewed";
  source: string;
  kind?: ReportKind;
  place_name?: string;
  observed_at?: string;
  details?: ReportDetails;
  photo_uri?: string;
  media_kind?: "photo" | "video";
  media_bytes?: number;
  expires_at?: string;
  offline_snapshot_at?: string;
  extent?: import("./observationExtent").ObservationExtent | null;
  response_summary?: {
    observed: number;
    changed: number;
    not_observed: number;
    latest: string | null;
  };
  demo?: boolean;
  taxonomy_version?: number;
  domain_id?: DomainId;
  topic_id?: string;
  event_type_id?: string;
  related_type_ids?: string[];
  answers?: Answers;
  privacy_class?: PrivacyClass;
  status?: "published" | "review" | "hidden";
};
export const categories: Category[] = ["Safety", "Outdoors", "Travel"];
export const reportKinds = {
  hazard: { label: "Safety observation", color: "#bda9dc", category: "Safety" },
  smoke: { label: "Smoke / fire", color: "#ff9b55", category: "Safety" },
  flooding: { label: "Flooding", color: "#55cdea", category: "Safety" },
  wildlife: { label: "Wildlife", color: "#76d99e", category: "Outdoors" },
  trail: { label: "Trail", color: "#51c9bc", category: "Outdoors" },
  aurora: { label: "Aurora", color: "#c49af6", category: "Outdoors" },
  road: { label: "Road / travel", color: "#79b8ff", category: "Travel" },
} as const;
export type ReportKind = keyof typeof reportKinds;
export type ReportDetails = {
  animal?: string;
  count?: number;
  surface?: string;
  visibility?: string;
};
export const defaultKind: Record<Category, ReportKind> = {
  Safety: "hazard",
  Outdoors: "wildlife",
  Travel: "road",
};
export const reportPresets: Record<
  Category,
  { title: string; kind: ReportKind }[]
> = {
  Safety: [
    { title: "Icy conditions", kind: "hazard" },
    { title: "Smoke observed", kind: "smoke" },
    { title: "Flooding", kind: "flooding" },
    { title: "Fallen tree", kind: "hazard" },
  ],
  Outdoors: [
    { title: "Whale sighting", kind: "wildlife" },
    { title: "Wildlife sighting", kind: "wildlife" },
    { title: "Trail conditions", kind: "trail" },
    { title: "Aurora sighting", kind: "aurora" },
  ],
  Travel: [
    { title: "Icy road", kind: "road" },
    { title: "Poor visibility", kind: "road" },
    { title: "Road obstruction", kind: "road" },
    { title: "Travel delay", kind: "road" },
  ],
};
export const reportTitles: Record<Category, readonly string[]> = {
  Safety: reportPresets.Safety.map((p) => p.title),
  Outdoors: reportPresets.Outdoors.map((p) => p.title),
  Travel: reportPresets.Travel.map((p) => p.title),
};
export function reportAppearance(
  report: Pick<Observation, "kind" | "category" | "event_type_id">,
) {
  const event = typeById(
    "event_type_id" in report ? String(report.event_type_id ?? "") : undefined,
  );
  return event
    ? { label: event.label, color: event.color, category: report.category }
    : reportKinds[report.kind ?? defaultKind[report.category]];
}
export function validateDetails(
  category: Category,
  kind: ReportKind,
  details: ReportDetails,
  observedAt: string,
  now = Date.now(),
) {
  if (!reportKinds[kind] || reportKinds[kind].category !== category)
    throw new Error("Choose a report type within the selected category.");
  const time = Date.parse(observedAt);
  if (
    !Number.isFinite(time) ||
    time > now + 60000 ||
    time < now - 30 * 86400000
  )
    throw new Error(
      "Choose an observation time within the last 30 days, not in the future.",
    );
  if (details.animal && details.animal.length > 80)
    throw new Error("Keep the animal name under 80 characters.");
  if (
    details.count !== undefined &&
    (!Number.isInteger(details.count) ||
      details.count < 1 ||
      details.count > 10000)
  )
    throw new Error(
      "Enter an approximate animal count between 1 and 10,000, or leave it blank.",
    );
  if (
    details.surface &&
    !["Unknown", "Dry", "Wet", "Snow", "Ice"].includes(details.surface)
  )
    throw new Error("Choose a listed road surface.");
  if (
    details.visibility &&
    !["Unknown", "Good", "Reduced", "Very poor"].includes(details.visibility)
  )
    throw new Error("Choose a listed visibility condition.");
}
export function observedTime(report: Observation) {
  return report.observed_at ?? report.created_at;
}
export type MapBounds = [number, number, number, number];
export function withinBounds(
  report: Pick<Observation, "latitude" | "longitude">,
  bounds: MapBounds,
) {
  const [w, s, e, n] = bounds;
  return (
    report.latitude >= s &&
    report.latitude <= n &&
    (w <= e
      ? report.longitude >= w && report.longitude <= e
      : report.longitude >= w || report.longitude <= e)
  );
}
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180,
    lat = (b.latitude - a.latitude) * rad,
    lon = (b.longitude - a.longitude) * rad;
  const v =
    Math.sin(lat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)));
}
export function validateReportText(title: string, description: string) {
  if (title.trim().length < 5 || title.length > 100)
    throw new Error("Use a title between 5 and 100 characters.");
  if (description.length > 2000)
    throw new Error("Keep the optional note under 2000 characters.");
}
export function validateReport(
  title: string,
  description: string,
  latitude: number,
  longitude: number,
) {
  validateReportText(title, description);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new Error("Choose a valid location.");
}
export function age(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(date)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago${hours > 24 ? " · STALE" : ""}`;
}
export const demo: Observation[] = [
  {
    id: "demo-1",
    category: "Safety",
    kind: "hazard",
    place_name: "Anchorage shoreline",
    title: "Ice along the shoreline",
    description:
      "DEMO scenario: slick ice near a public shoreline access. This is fictional sample data, not a current hazard.",
    latitude: 61.218,
    longitude: -149.92,
    created_at: "2026-01-01T12:00:00Z",
    verification: "unverified",
    source: "DEMO · community",
    demo: true,
  },
  {
    id: "demo-2",
    category: "Outdoors",
    kind: "trail",
    place_name: "Anchorage foothills",
    title: "A quiet trail through the spruce",
    description:
      "DEMO scenario: a trail condition observation near Anchorage. Check real conditions before departure.",
    latitude: 61.16,
    longitude: -149.73,
    created_at: "2026-01-01T12:00:00Z",
    verification: "unverified",
    source: "DEMO · community",
    demo: true,
  },
  {
    id: "demo-3",
    category: "Travel",
    kind: "road",
    place_name: "Turnagain Arm",
    title: "Visibility on the coastal road",
    description:
      "DEMO scenario: reduced visibility along Turnagain Arm. No official road advisory is connected.",
    latitude: 61.01,
    longitude: -149.62,
    created_at: "2026-01-01T12:00:00Z",
    verification: "unverified",
    source: "DEMO · community",
    demo: true,
  },
];

export function normalizeBounds(bounds: MapBounds): MapBounds {
  const [w, s, e, n] = bounds;
  if (e - w >= 360) return [-180, Math.max(-90, s), 180, Math.min(90, n)];
  const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
  return [wrap(w), Math.max(-90, s), wrap(e), Math.min(90, n)];
}

export function observationDomain(report: Observation): DomainId {
  return report.domain_id ?? legacyPath(report.category, report.kind).domainId!;
}
