import { useRef, useEffect, useState } from "react";
import {
  Map,
  Images,
  MapRef,
  Camera,
  GeoJSONSource,
  Layer,
  CameraRef,
  GeoJSONSourceRef,
} from "@maplibre/maplibre-react-native";
import { View, Text } from "react-native";
import { Button, styles } from "./ui";
import { useNow } from "./Clock";
import { effectiveAssessment, riskPresentation } from "./assessment";
import useTileHealth from "./useTileHealth";
import { mapSymbols } from "./mapSymbols";
import { markerFamily } from "./markerFamily";
import ZoomControls from "./ZoomControls";
import { topographicStyle } from "./mapStyle";
import { OfficialItem } from "./official/adapters";
import {
  Observation,
  MapBounds,
  ReportLocation,
  reportAppearance,
} from "./domain";
export default function NativeMap({
  controlsHidden = false,
  attributionBottom = 162,
  center,
  selectedPlace,
  selectedId,
  observations,
  onSelect,
  officialItems = [],
  onOfficialSelect,
  onViewportChange,
}: {
  controlsHidden?: boolean;
  attributionBottom?: number;
  center: [number, number];
  selectedPlace?: ReportLocation | null;
  selectedId?: string;
  observations: Observation[];
  onSelect: (o: Observation) => void;
  officialItems?: OfficialItem[];
  onOfficialSelect?: (item: OfficialItem) => void;
  onViewportChange?: (view: {
    center: [number, number];
    bounds: MapBounds;
    zoom: number;
  }) => void;
}) {
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const initial = useRef({ center, zoom: 9 });
  const first = useRef(true);
  const now = useNow();
  const [failed, setFailed] = useTileHealth(),
    [retry, setRetry] = useState(0);
  const lastRetry = useRef(0);
  const [zoom, setZoom] = useState(9);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (selectedPlace?.bounds)
      camera.current?.fitBounds(selectedPlace.bounds, {
        duration: 600,
        padding: { top: 160, bottom: 180, left: 40, right: 40 },
      });
    else
      camera.current?.flyTo({
        center,
        zoom: selectedPlace?.focusZoom ?? 12,
        duration: 600,
      });
  }, [center, selectedPlace]);
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

  const source = useRef<GeoJSONSourceRef>(null);
  const shape: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: observations
      .filter((o) => o.privacy_class !== "restricted")
      .map((o) => ({
        type: "Feature",
        id: o.id,
        properties: {
          id: o.id,
          category: o.category,
          icon: markerFamily(o),
          selected: o.id === selectedId,
          color: reportAppearance(o).color,
          risk:
            effectiveAssessment(o, now).level === "none"
              ? "#10282c"
              : riskPresentation[effectiveAssessment(o, now).level].color,
        },
        geometry: { type: "Point", coordinates: [o.longitude, o.latitude] },
      })),
  };
  return (
    <View style={{ flex: 1 }}>
      <Map
        key={retry}
        ref={map}
        onDidFailLoadingMap={() => setFailed(true)}
        onDidFinishRenderingMapFully={() => setFailed(false)}
        style={{ flex: 1 }}
        onRegionDidChange={(event) => {
          initial.current = {
            center: event.nativeEvent.center,
            zoom: event.nativeEvent.zoom,
          };
          setZoom(event.nativeEvent.zoom);
          onViewportChange?.(event.nativeEvent);
        }}
        mapStyle={topographicStyle}
        attribution
        attributionPosition={{ bottom: attributionBottom, right: 10 }}
        logo
      >
        <Images
          images={Object.fromEntries(
            Object.entries(mapSymbols).map(([key, value]) => [
              key,
              value.image,
            ]),
          )}
        />
        <Camera
          ref={camera}
          initialViewState={initial.current}
          minZoom={1}
          maxZoom={17}
        />
        {selectedPlace && (
          <GeoJSONSource
            id="selected-place"
            data={{
              type: "Feature",
              properties: { name: selectedPlace.name },
              geometry: {
                type: "Point",
                coordinates: [selectedPlace.longitude, selectedPlace.latitude],
              },
            }}
          >
            <Layer
              id="selected-place-marker"
              type="circle"
              paint={{
                "circle-color": "#ffffff",
                "circle-radius": 11,
                "circle-stroke-color": "#43a9ee",
                "circle-stroke-width": 4,
              }}
            />
          </GeoJSONSource>
        )}
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
              (item) =>
                item.id === event.nativeEvent.features[0]?.properties?.id,
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
              "circle-color": "#52666c",
              "circle-radius": 22,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            }}
          />
          <Layer
            type="circle"
            id="selected-observation-halo"
            filter={[
              "all",
              ["!", ["has", "point_count"]],
              ["==", ["get", "selected"], true],
            ]}
            paint={{
              "circle-color": "#ffffff",
              "circle-radius": 23,
              "circle-opacity": 0.3,
            }}
          />
          <Layer
            type="circle"
            id="points"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": 15,
              "circle-stroke-width": 3,
              "circle-stroke-color": ["get", "risk"],
            }}
          />
          <Layer
            id="observation-symbols"
            type="symbol"
            filter={["!", ["has", "point_count"]]}
            layout={{
              "icon-image": ["get", "icon"],
              "icon-size": 0.3,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            }}
          />
        </GeoJSONSource>
      </Map>
      {failed && (
        <View
          style={[
            styles.card,
            { position: "absolute", left: 12, right: 12, top: "45%" },
          ]}
        >
          <Text style={styles.text}>
            Map tiles could not load. Observations remain available in the
            cards.
          </Text>
          <Button
            label="Retry map"
            onPress={() => {
              if (Date.now() - lastRetry.current < 5000) return;
              lastRetry.current = Date.now();
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          />
        </View>
      )}
      {!controlsHidden && (
        <ZoomControls
          zoom={zoom}
          onZoom={(delta) => {
            void zoomBy(delta);
          }}
        />
      )}
    </View>
  );
}
