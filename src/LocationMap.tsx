import PlaceOutlineLayer from "./PlaceOutlineLayer";
import { useRef, useState } from "react";
import {
  Map,
  MapRef,
  CameraRef,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { View, Text } from "react-native";
import { Button, styles } from "./ui";
import useTileHealth from "./useTileHealth";
import ZoomControls from "./ZoomControls";
import { topographicStyle } from "./mapStyle";
import type { ObservationExtent } from "./observationExtent";
import { ReportLocation } from "./domain";
export type LocationMapProps = {
  location: ReportLocation | null;
  onPick: (location: ReportLocation) => void;
  extent?: ObservationExtent | null;
};
export default function LocationMap({
  location,
  onPick,
  extent,
}: LocationMapProps) {
  const center: [number, number] = location
    ? [location.longitude, location.latitude]
    : [-149.9, 61.218];
  const initialView = useRef({
    center,
    zoom: location?.focusZoom ?? (location ? 12 : 9),
  });
  const camera = useRef<CameraRef>(null),
    map = useRef<MapRef>(null);
  const [failed, setFailed] = useTileHealth(),
    [retry, setRetry] = useState(0);
  const lastRetry = useRef(0);
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
        key={retry}
        ref={map}
        onDidFailLoadingMap={() => setFailed(true)}
        onDidFinishRenderingMapFully={() => setFailed(false)}
        onRegionDidChange={(e) => {
          initialView.current = {
            center: e.nativeEvent.center,
            zoom: e.nativeEvent.zoom,
          };
          setZoom(e.nativeEvent.zoom);
        }}
        style={{ flex: 1 }}
        mapStyle={topographicStyle}
        attribution
        onPress={(event) => {
          const [longitude, latitude] = event.nativeEvent.lngLat;
          onPick({
            name: "Adjusted observation pin",
            reference_name: location?.reference_name ?? location?.name,
            latitude,
            longitude,
          });
        }}
      >
        <PlaceOutlineLayer place={location} />
        <Camera
          ref={camera}
          initialViewState={initialView.current}
          minZoom={1}
          maxZoom={17}
        />
        {extent && (
          <GeoJSONSource
            id="observed-extent"
            data={{
              type: "Feature",
              properties: {},
              geometry: extent as GeoJSON.Geometry,
            }}
          >
            {extent.type === "Polygon" && (
              <Layer
                id="extent-fill"
                type="fill"
                paint={{ "fill-color": "#9ce5d9", "fill-opacity": 0.15 }}
              />
            )}
            <Layer
              id="extent-line"
              type="line"
              paint={{
                "line-color": "#9ce5d9",
                "line-width": 3,
                "line-dasharray": [2, 2],
              }}
            />
          </GeoJSONSource>
        )}
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
      {failed && (
        <View
          style={[
            styles.card,
            { position: "absolute", top: 12, left: 12, right: 12 },
          ]}
        >
          <Text style={styles.text}>
            Map unavailable. Cancel and search for a place, or retry.
          </Text>
          <Button
            label="Retry location map"
            onPress={() => {
              if (Date.now() - lastRetry.current < 5000) return;
              lastRetry.current = Date.now();
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          />
        </View>
      )}
      <ZoomControls
        zoom={zoom}
        onZoom={(delta) => {
          void zoomBy(delta);
        }}
      />
    </View>
  );
}
