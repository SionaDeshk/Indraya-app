import { useRef } from "react";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { topographicStyle } from "./mapStyle";
import { ReportLocation } from "./domain";
export type LocationMapProps = {
  location: ReportLocation | null;
  onPick: (location: ReportLocation) => void;
};
export default function LocationMap({ location, onPick }: LocationMapProps) {
  const center: [number, number] = location
    ? [location.longitude, location.latitude]
    : [-149.9, 61.218];
  const initialView = useRef({ center, zoom: location ? 12 : 9 });
  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={topographicStyle}
      attribution
      onPress={(event) => {
        const [longitude, latitude] = event.nativeEvent.lngLat;
        onPick({ name: "Dropped pin", latitude, longitude });
      }}
    >
      <Camera initialViewState={initialView.current} />
      {location !== null && (
        <GeoJSONSource
          id="report-pin"
          data={{
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: center },
          }}
        >
          <Layer
            id="report-pin-ring"
            type="circle"
            paint={{
              "circle-radius": 20,
              "circle-color": "#e6b875",
              "circle-opacity": 0.25,
            }}
          />
          <Layer
            id="report-pin-center"
            type="circle"
            paint={{
              "circle-radius": 9,
              "circle-color": "#e6b875",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#10282c",
            }}
          />
        </GeoJSONSource>
      )}
    </Map>
  );
}
