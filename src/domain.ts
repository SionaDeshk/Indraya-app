export type ReportLocation = {
  name: string;
  latitude: number;
  longitude: number;
};
export type Category = "Safety" | "Outdoors" | "Travel";
export type Observation = {
  id: string;
  category: Category;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  created_at: string;
  verification: "unverified" | "reviewed";
  source: string;
  demo?: boolean;
};
export const categories: Category[] = ["Safety", "Outdoors", "Travel"];
export function validateReport(
  title: string,
  description: string,
  latitude: number,
  longitude: number,
) {
  if (title.trim().length < 5 || title.length > 100)
    throw new Error("Use a title between 5 and 100 characters.");
  if (description.trim().length < 10 || description.length > 2000)
    throw new Error("Describe what you observed in 10–2000 characters.");
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new Error("Choose a valid location.");
}
export function age(date: string) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(date)) / 3600000),
  );
  return hours < 1
    ? "Just now"
    : `${hours}h ago${hours > 24 ? " · STALE" : ""}`;
}
export const demo: Observation[] = [
  {
    id: "demo-1",
    category: "Safety",
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
export const places: ReportLocation[] = [
  { name: "Beluga Point", latitude: 60.977, longitude: -149.644 },
  { name: "Anchorage", latitude: 61.2181, longitude: -149.9003 },
  { name: "Denali mountain", latitude: 63.0695, longitude: -151.0074 },
  { name: "Mendenhall Lake", latitude: 58.417, longitude: -134.548 },
  { name: "Kenai River", latitude: 60.55, longitude: -151.25 },
  { name: "Flattop Mountain Trail", latitude: 61.09, longitude: -149.665 },
  { name: "Seward Highway", latitude: 60.95, longitude: -149.42 },
];
