import {
  type Observation,
  type MapBounds,
  distanceKm,
  observationDomain,
  observedTime,
  withinBounds,
} from "./domain";
import { extentIntersectsBounds } from "./observationExtent";
import { isActive } from "./observationLifecycle";

type NearbyOptions = {
  now: number;
  history: boolean;
  domain: string;
  bounds: MapBounds | null;
  center: [number, number];
  // True only for results from observations_in_bounds for these exact bounds.
  spatiallyMatched: boolean;
};

export function nearbyObservations(
  reports: Observation[],
  { now, history, domain, bounds, center, spatiallyMatched }: NearbyOptions,
) {
  return reports
    .filter((report) => history || isActive(report, now))
    .filter(
      (report) => domain === "all" || domain === observationDomain(report),
    )
    .filter((report) => {
      // The server tests the full extent. Checking its anchor again would hide
      // intersecting lines/areas whose original point lies outside the viewport.
      if (bounds && spatiallyMatched) return true;
      return bounds
        ? withinBounds(report, bounds) ||
            (report.privacy_class === "approximate" &&
              !!report.extent &&
              extentIntersectsBounds(report.extent, bounds))
        : distanceKm(report, { longitude: center[0], latitude: center[1] }) <=
            50;
    })
    .sort((a, b) => Date.parse(observedTime(b)) - Date.parse(observedTime(a)));
}

export function nearbySource(options: {
  loaded: Observation[];
  spatial?: Observation[];
  viewport: boolean;
  history: boolean;
  failed: boolean;
  savedAt: number;
}) {
  if (options.history || !options.viewport)
    return {
      rows: options.loaded,
      spatiallyMatched: false,
      snapshot: options.loaded.some((r) => !!r.offline_snapshot_at),
    };
  if (!options.failed)
    return {
      rows: options.spatial ?? [],
      spatiallyMatched: true,
      snapshot: false,
    };
  const rows = [
    ...new Map(
      [...options.loaded, ...(options.spatial ?? [])].map((r) => [r.id, r]),
    ).values(),
  ];
  return {
    rows: rows.map((r) => ({
      ...r,
      offline_snapshot_at:
        r.offline_snapshot_at ?? new Date(options.savedAt).toISOString(),
    })),
    spatiallyMatched: false,
    snapshot: rows.length > 0,
  };
}
