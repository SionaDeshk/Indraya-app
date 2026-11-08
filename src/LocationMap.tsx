import { useRef, useState } from "react";
import {
  Map,
  MapRef,
  CameraRef,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { View } from "react-native";
import ZoomControls from "./ZoomControls";
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
  const camera = useRef<CameraRef>(null),
    map = useRef<MapRef>(null);
  const [zoom, setZoom] = useState(initialView.current.zoom);
  async function zoomBy(delta: number) {
    try {
      const current = (await map.current?.getZoom()) ?? zoom;
      camera.current?.zoomTo(Math.max(1, Math.min(17, current + delta)), {
        duration: 250,
      });
    } catch {
      camera.current?.zoomTo(Math.max(1, Math.min(17, zoom + delta)));
    }
  }
  return (
    <View style={{ flex: 1 }}>
      <Map
        ref={map}
        onRegionDidChange={(e) => setZoom(e.nativeEvent.zoom)}
        style={{ flex: 1 }}
        mapStyle={topographicStyle}
        attribution
        onPress={(event) => {
          const [longitude, latitude] = event.nativeEvent.lngLat;
          onPick({ name: "Dropped pin", latitude, longitude });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={initialView.current}
          minZoom={1}
          maxZoom={17}
        />
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
      <ZoomControls
        zoom={zoom}
        onZoom={(delta) => {
          void zoomBy(delta);
        }}
      />
    </View>
  );
}
