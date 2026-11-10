import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { placeOutline } from "./placeOutlines";
import type { ReportLocation } from "./domain";
export default function PlaceOutlineLayer({
  place,
}: {
  place?: ReportLocation | null;
}) {
  const outline = placeOutline(place);
  if (!outline) return null;
  return (
    <GeoJSONSource id="selected-reference-outline" data={outline}>
      <Layer
        id="selected-reference-fill"
        type="fill"
        paint={{ "fill-color": "#43a9ee", "fill-opacity": 0.07 }}
      />
      <Layer
        id="selected-reference-line"
        type="line"
        paint={{ "line-color": "#43a9ee", "line-width": 2 }}
      />
    </GeoJSONSource>
  );
}
