import { useRef } from "react";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  CameraRef,
  GeoJSONSourceRef,
} from "@maplibre/maplibre-react-native";
import { topographicStyle } from "./mapStyle";
import { OfficialItem } from "./official/adapters";
import { Observation } from "./domain";
export default function NativeMap({
  center,
  observations,
  onSelect,
  officialItems = [],
  onOfficialSelect,
}: {
  center: [number, number];
  observations: Observation[];
  onSelect: (o: Observation) => void;
  officialItems?: OfficialItem[];
  onOfficialSelect?: (item: OfficialItem) => void;
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
      mapStyle={topographicStyle}
      attribution
      attributionPosition={{ bottom: 310, right: 10 }}
      logo
    >
      <Camera ref={camera} center={center} zoom={9} duration={800} />
      <GeoJSONSource
        id="official-reports"
        data={{
          type: "FeatureCollection",
          features: officialItems.flatMap((item) =>
            item.geometry
              ? [
                  {
                    type: "Feature" as const,
                    id: item.id,
                    properties: { id: item.id },
                    geometry: item.geometry,
                  },
                ]
              : [],
          ),
        }}
        onPress={(event) => {
          const item = officialItems.find(
            (item) => item.id === event.nativeEvent.features[0]?.properties?.id,
          );
          if (item) onOfficialSelect?.(item);
        }}
      >
        <Layer
          type="fill"
          id="official-alert-areas"
          filter={["==", ["geometry-type"], "Polygon"]}
          paint={{ "fill-color": "#9599ec", "fill-opacity": 0.2 }}
        />
        <Layer
          type="line"
          id="official-alert-boundaries"
          filter={["==", ["geometry-type"], "Polygon"]}
          paint={{ "line-color": "#c6c8ff", "line-width": 2 }}
        />
        <Layer
          type="circle"
          id="official-earthquakes"
          filter={["==", ["geometry-type"], "Point"]}
          paint={{
            "circle-color": "#f3f2ff",
            "circle-stroke-color": "#7f79c4",
            "circle-stroke-width": 4,
            "circle-radius": 9,
          }}
        />
      </GeoJSONSource>
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
