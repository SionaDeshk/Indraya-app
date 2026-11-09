import { typeById, type PrivacyClass } from "./taxonomy";
export type ObservationExtent = {
  type: "LineString" | "Polygon";
  coordinates: number[][] | number[][][];
  context?: "traffic_backup" | "observed_conditions";
};
export function extentModes(
  type?: string,
  privacy: PrivacyClass = "approximate",
) {
  return privacy === "approximate"
    ? (typeById(type)?.extentModes ?? ["point"])
    : ["point"];
}
export function normalizeExtent(
  value: ObservationExtent | null | undefined,
  type: string,
  privacy: PrivacyClass,
  latitude: number,
  longitude: number,
): ObservationExtent | null {
  if (!value || privacy !== "approximate") return null;
  const mode =
    value.type === "LineString"
      ? "line"
      : value.type === "Polygon"
        ? "area"
        : "invalid";
  if (!extentModes(type, privacy).includes(mode as "line"))
    throw Error("This observation uses one spot only.");
  const raw =
    value.type === "Polygon"
      ? (value.coordinates[0] as number[][])
      : (value.coordinates as number[][]);
  if (
    !Array.isArray(raw) ||
    raw.length < (mode === "line" ? 2 : 4) ||
    raw.length > (mode === "line" ? 16 : 17)
  )
    throw Error("Choose a small stretch or area with 2–16 points.");
  const points = raw.map((p) => {
    if (
      !Array.isArray(p) ||
      p.length !== 2 ||
      !p.every(Number.isFinite) ||
      Math.abs(p[0]) > 180 ||
      Math.abs(p[1]) > 90 ||
      Math.abs(p[0] - longitude) > 0.5 ||
      Math.abs(p[1] - latitude) > 0.5
    )
      throw Error("Keep the extent near the place you observed.");
    return p.map((n) => Math.round(n * 100) / 100);
  });
  if (
    mode === "area" &&
    JSON.stringify(points[0]) !== JSON.stringify(points.at(-1))
  )
    throw Error("Close the observed area before continuing.");
  if (new Set(points.map((p) => p.join(","))).size < (mode === "line" ? 2 : 3))
    throw Error("Choose distinct points for the observed extent.");
  if (mode === "area") {
    let area = 0;
    for (let i = 0; i < points.length - 1; i++)
      area += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
    if (Math.abs(area) < 1e-10)
      throw Error("Choose a non-empty observed area.");
    const orient = (a: number[], b: number[], c: number[]) =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const on = (a: number[], b: number[], p: number[]) =>
      Math.abs(orient(a, b, p)) < 1e-10 &&
      p[0] >= Math.min(a[0], b[0]) &&
      p[0] <= Math.max(a[0], b[0]) &&
      p[1] >= Math.min(a[1], b[1]) &&
      p[1] <= Math.max(a[1], b[1]);
    for (let i = 0; i < points.length - 1; i++)
      for (let j = i + 2; j < points.length - 1; j++) {
        if (i === 0 && j === points.length - 2) continue;
        const [a, b, c, d] = [
          points[i],
          points[i + 1],
          points[j],
          points[j + 1],
        ];
        if (
          (orient(a, b, c) * orient(a, b, d) < 0 &&
            orient(c, d, a) * orient(c, d, b) < 0) ||
          on(a, b, c) ||
          on(a, b, d) ||
          on(c, d, a) ||
          on(c, d, b)
        )
          throw Error("The observed area must not cross itself.");
      }
  }
  return {
    type: value.type,
    context: type === "collision" ? "traffic_backup" : "observed_conditions",
    coordinates: value.type === "Polygon" ? [points] : points,
  };
}

// Saved snapshots have no server intersection query. Handle lines crossing a
// viewport and polygons covering it, not just vertices/anchor points.
export function extentIntersectsBounds(
  extent: ObservationExtent,
  bounds: [number, number, number, number],
) {
  const points = (
    extent.type === "Polygon" ? extent.coordinates[0] : extent.coordinates
  ) as number[][];
  const [west, south, east, north] = bounds;
  const rects =
    west <= east
      ? [[west, south, east, north]]
      : [
          [west, south, 180, north],
          [-180, south, east, north],
        ];
  return rects.some(([w, s, e, n]) => {
    const inside = ([x, y]: number[]) => x >= w && x <= e && y >= s && y <= n;
    if (points.some(inside)) return true;
    const corners = [
      [w, s],
      [e, s],
      [e, n],
      [w, n],
      [w, s],
    ];
    const cross = (a: number[], b: number[], c: number[]) =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const on = (a: number[], b: number[], p: number[]) =>
      Math.abs(cross(a, b, p)) < 1e-10 &&
      p[0] >= Math.min(a[0], b[0]) &&
      p[0] <= Math.max(a[0], b[0]) &&
      p[1] >= Math.min(a[1], b[1]) &&
      p[1] <= Math.max(a[1], b[1]);
    for (let i = 1; i < points.length; i++)
      for (let j = 1; j < corners.length; j++) {
        const a = points[i - 1],
          b = points[i],
          c = corners[j - 1],
          d = corners[j];
        if (
          (cross(a, b, c) * cross(a, b, d) < 0 &&
            cross(c, d, a) * cross(c, d, b) < 0) ||
          on(a, b, c) ||
          on(a, b, d) ||
          on(c, d, a) ||
          on(c, d, b)
        )
          return true;
      }
    if (extent.type !== "Polygon") return false;
    let contained = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i],
        [xj, yj] = points[j];
      if (yi > s !== yj > s && w < ((xj - xi) * (s - yi)) / (yj - yi) + xi)
        contained = !contained;
    }
    return contained;
  });
}
