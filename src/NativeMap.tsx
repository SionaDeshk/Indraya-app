import { useRef } from "react";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  RasterSource,
  CameraRef,
  GeoJSONSourceRef,
} from "@maplibre/maplibre-react-native";
import { Observation } from "./domain";
export default function NativeMap({
  center,
  observations,
  onSelect,
  topo,
}: {
  center: [number, number];
  observations: Observation[];
  onSelect: (o: Observation) => void;
  topo: boolean;
}) {
  const camera = useRef<CameraRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  const shape: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: observations.map((o) => ({
      type: "Feature",
      id: o.id,
      properties: { id: o.id, category: o.category },
      geometry: { type: "Point", coordinates: [o.longitude, o.latitude] },
    })),
  };
  return (
    <Map
      style={{ flex: 1 }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      attribution
      attributionPosition={{ bottom: 310, right: 10 }}
      logo
    >
      <Camera ref={camera} center={center} zoom={9} duration={800} />
      {topo && (
        <RasterSource
          id="topo"
          tiles={["https://tile.opentopomap.org/{z}/{x}/{y}.png"]}
          maxzoom={17}
          tileSize={256}
          attribution="© OpenStreetMap contributors · SRTM | © OpenTopoMap (CC-BY-SA)"
        >
          <Layer type="raster" id="topo-layer" />
        </RasterSource>
      )}
      <GeoJSONSource
        ref={source}
        id="observations"
        data={shape}
        cluster
        clusterRadius={45}
        onPress={async (e) => {
          const feature = e.nativeEvent.features[0];
          if (!feature) return;
          if (
            feature.properties?.cluster &&
            feature.geometry.type === "Point"
          ) {
            try {
              const zoom = await source.current?.getClusterExpansionZoom(
                Number(feature.properties.cluster_id),
              );
              camera.current?.easeTo({
                center: feature.geometry.coordinates as [number, number],
                zoom: zoom ?? 12,
                duration: 500,
              });
            } catch {
              camera.current?.zoomTo(12);
            }
            return;
          }
          const item = observations.find(
            (o) => o.id === feature.properties?.id,
          );
          if (item) onSelect(item);
        }}
      >
        <Layer
          type="circle"
          id="clusters"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": "#94dace",
            "circle-radius": 22,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          }}
        />
        <Layer
          type="symbol"
          id="cluster-count"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
          }}
          paint={{ "text-color": "#10282c" }}
        />
        <Layer
          type="circle"
          id="points"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": [
              "match",
              ["get", "category"],
              "Safety",
              "#e6b875",
              "Outdoors",
              "#83d6bf",
              "#9bcbe7",
            ],
            "circle-radius": 9,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#10282c",
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}
