import {
  type Observation,
  type MapBounds,
  distanceKm,
  observationDomain,
  observedTime,
  withinBounds,
} from "./domain";
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
        ? withinBounds(report, bounds)
        : distanceKm(report, { longitude: center[0], latitude: center[1] }) <=
            50;
    })
    .sort((a, b) => Date.parse(observedTime(b)) - Date.parse(observedTime(a)));
}
