import { useState } from "react";
import { View, Text, ScrollView, Modal } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import {
  observationDomain,
  ReportLocation,
  Observation,
  age,
  MapBounds,
  normalizeBounds,
  withinBounds,
  distanceKm,
  observedTime,
} from "../domain";
import { observations, flag, supabase } from "../api";
import { Button, styles } from "../ui";
import PlaceSearch from "../PlaceSearch";
import ObservationDetails from "../ObservationDetails";
import ChoiceSheet from "../ChoiceSheet";
import { catalog } from "../taxonomy";
import { riskPresentation } from "../assessment";
import ObservationCard from "../ObservationCard";
import NativeMap from "../NativeMap";
import * as Linking from "expo-linking";
import { useOfficialFeeds } from "../official/useOfficialFeeds";
import { OfficialItem } from "../official/adapters";
export default function Home() {
  const [filters, setFilters] = useState("all");
  const [searchPlace, setSearchPlace] = useState<ReportLocation | null>(null);
  const [selected, setSelected] = useState<Observation | null>(null);
  const [center, setCenter] = useState<[number, number]>([-149.9, 61.218]);
  const [message, setMessage] = useState("");
  const [viewport, setViewport] = useState<{
    center: [number, number];
    bounds: MapBounds | null;
  }>({ center: [-149.9, 61.218], bounds: null });
  const [nearby, setNearby] = useState(false);
  const [legend, setLegend] = useState(false);
  const [officialDetail, setOfficialDetail] = useState<OfficialItem | null>(
    null,
  );
  const feeds = useOfficialFeeds();
  const q = useQuery({ queryKey: ["observations"], queryFn: observations });
  const spatial = useQuery<Observation[]>({
    queryKey: ["nearby-observations", viewport.bounds],
    enabled: !!supabase && viewport.bounds !== null,
    queryFn: async ({ signal }) => {
      if (!supabase || !viewport.bounds) return [];
      const [west, south, east, north] = viewport.bounds;
      const { data, error } = await supabase
        .rpc("observations_in_bounds", { west, south, east, north })
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []).map((row: Observation) => ({
        ...row,
        source: "Community",
      }));
    },
    staleTime: 30000,
  });
  const loadedReports = [
    ...new Map(
      [...(q.data ?? []), ...(spatial.data ?? [])].map((report) => [
        report.id,
        report,
      ]),
    ).values(),
  ];
  const visible = loadedReports.filter(
    (o) => filters === "all" || filters === observationDomain(o),
  );
  const nearbyReports = (
    supabase && viewport.bounds
      ? (spatial.data ?? []).filter(
          (report) =>
            filters === "all" || filters === observationDomain(report),
        )
      : visible
  )
    .filter((report) =>
      viewport.bounds
        ? withinBounds(report, viewport.bounds)
        : distanceKm(report, {
            longitude: viewport.center[0],
            latitude: viewport.center[1],
          }) <= 50,
    )
    .sort((a, b) => Date.parse(observedTime(b)) - Date.parse(observedTime(a)));
  function selectReport(report: Observation) {
    setSearchPlace(null);
    if (report.privacy_class !== "restricted")
      setCenter([report.longitude, report.latitude]);
    setSelected(report);
  }
  async function locate() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw Error(
          "Location permission declined. You can still explore the map.",
        );
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCenter([p.coords.longitude, p.coords.latitude]);
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#071719" }}>
      <NativeMap
        center={center}
        selectedPlace={searchPlace}
        observations={visible}
        onSelect={selectReport}
        onViewportChange={(view) =>
          setViewport({
            center: view.center,
            bounds: normalizeBounds(view.bounds),
          })
        }
        officialItems={feeds.items}
        onOfficialSelect={setOfficialDetail}
      />
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", top: 60, left: 20, right: 20, gap: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                color: "#e5f5ef",
                fontSize: 30,
                letterSpacing: 5,
                fontWeight: "600",
              }}
            >
              INDRAYA
            </Text>
            <Text style={{ color: "#9bc9c6" }}>
              Together, we see the world.
            </Text>
          </View>
          <Button label="Account" onPress={() => router.push("/account")} />
        </View>
        <PlaceSearch
          focus={viewport.center}
          onChoose={(place) => {
            setSearchPlace(place);
            setCenter([place.longitude, place.latitude]);
            setViewport({
              center: [place.longitude, place.latitude],
              bounds: null,
            });
          }}
        />
        <ChoiceSheet
          label="Observation category"
          value={filters}
          options={[
            { value: "all", label: "All categories" },
            ...catalog.domains.map((d) => ({ value: d.id, label: d.label })),
          ]}
          onChange={setFilters}
        />
        {searchPlace && (
          <View style={styles.card}>
            <Text style={styles.text}>
              Selected place: {searchPlace.name} · {searchPlace.context}
            </Text>
            <Text style={styles.text}>
              Place reference only · no observation created
            </Text>
            <Button
              label="Clear selected place"
              onPress={() => setSearchPlace(null)}
            />
          </View>
        )}
        <Text
          style={{
            color: "#edc88e",
            backgroundColor: "#10282c",
            padding: 10,
            borderRadius: 10,
          }}
        >
          {supabase
            ? "COMMUNITY · Not emergency dispatch"
            : "DEMO EXPLORER · Fictional observations"}
        </Text>
        {q.isLoading && <Text style={styles.text}>Loading observations…</Text>}
        {q.error && (
          <Button
            label="Unable to load · Retry"
            onPress={() => {
              void q.refetch();
            }}
          />
        )}
        {message.length > 0 && (
          <Text accessibilityRole="alert" style={styles.text}>
            {message}
          </Text>
        )}
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: 35,
          left: 20,
          right: 20,
          gap: 10,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}
        >
          <Button
            label="Locate me"
            onPress={() => {
              void locate();
            }}
          />
          <Button
            label="Layers & sources"
            onPress={() => router.push("/sources")}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.text}>
            {visible.length} community observations · Alaska
          </Text>
          {feeds.selected.some((id) => feeds.queries[id].isError) && (
            <Text style={{ color: "#edc88e" }}>
              Official source refresh failed · open Layers & sources
            </Text>
          )}
          {feeds.items.length > 0 && (
            <ScrollView horizontal>
              {feeds.items.map((item) => (
                <Button
                  key={item.id}
                  label={`OFFICIAL · ${item.title}`}
                  onPress={() => setOfficialDetail(item)}
                />
              ))}
            </ScrollView>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label={nearby ? "Show map cards" : "Nearby activity"}
              onPress={() => setNearby(!nearby)}
            />
            <Button label="Map legend" onPress={() => setLegend(true)} />
          </View>
          {nearby && spatial.isFetching && (
            <Text style={styles.text}>
              Loading observations in this map area…
            </Text>
          )}
          {nearby && spatial.error && (
            <Button
              label="Nearby reports unavailable · Retry"
              onPress={() => {
                void spatial.refetch();
              }}
            />
          )}
          {nearby && (
            <Text style={styles.text}>
              {nearbyReports.length} in this map area · newest first · up to 300
              loaded
            </Text>
          )}
          <ScrollView
            horizontal={!nearby}
            style={{
              height: nearby ? 210 : 120,
              maxHeight: nearby ? 210 : 120,
            }}
            nestedScrollEnabled
          >
            {(nearby ? nearbyReports : visible).map((report) => (
              <ObservationCard
                key={report.id}
                report={report}
                onPress={() => selectReport(report)}
                distance={
                  nearby
                    ? distanceKm(report, {
                        longitude: viewport.center[0],
                        latitude: viewport.center[1],
                      })
                    : undefined
                }
              />
            ))}
          </ScrollView>
          {nearby &&
            nearbyReports.length === 0 &&
            !spatial.isFetching &&
            !spatial.error && (
              <Text style={styles.text}>
                No observations in this map area. Zoom out or explore another
                place.
              </Text>
            )}
          {!q.isLoading && !visible.length && (
            <Text style={styles.text}>
              No observations in these layers. Share what you see.
            </Text>
          )}
          <Button
            label="＋ Share an observation"
            onPress={() => router.push("/report")}
          />
        </View>
      </View>
      <Modal
        visible={legend}
        transparent
        animationType="slide"
        onRequestClose={() => setLegend(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0006",
          }}
        >
          <View style={[styles.card, { paddingBottom: 40 }]}>
            <Text style={styles.heading}>Map legend</Text>
            {catalog.domains.map((kind) => (
              <View
                key={kind.label}
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: kind.color,
                  }}
                />
                <Text style={styles.text}>{kind.label}</Text>
              </View>
            ))}
            <Text style={styles.text}>
              White / purple: official source reports. Gray circles: clusters;
              tap to expand. Color indicates report type, never verification or
              severity.
            </Text>
            <Text style={styles.text}>
              Outer rings show staff assessment separately: yellow caution,
              orange hazard, red urgent danger. Expired assessments lose their
              ring. No ring does not mean safe.
            </Text>
            {Object.entries(riskPresentation)
              .filter(([id]) => id !== "none")
              .map(([id, r]) => (
                <Text key={id} style={{ color: r.color }}>
                  {r.label}
                </Text>
              ))}
            <Button label="Close legend" onPress={() => setLegend(false)} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={officialDetail !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setOfficialDetail(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0006",
          }}
        >
          <ScrollView
            style={{
              maxHeight: "80%",
              backgroundColor: "#10282c",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            contentContainerStyle={{ padding: 24, paddingBottom: 45, gap: 12 }}
          >
            {officialDetail !== null && (
              <>
                <Text style={{ color: "#b6b8ff" }}>
                  OFFICIAL SOURCE · {officialDetail.sourceName}
                </Text>
                <Text style={styles.heading}>{officialDetail.title}</Text>
                <Text style={styles.text}>
                  {age(officialDetail.observedAt)} ·{" "}
                  {officialDetail.expiresAt
                    ? `Valid until ${new Date(officialDetail.expiresAt).toLocaleString()}`
                    : "Check the source for updates"}
                </Text>
                {(() => {
                  const checked =
                    feeds.queries[officialDetail.feed].data?.fetchedAt;
                  return checked ? (
                    <Text style={styles.text}>
                      Source checked {age(checked)}
                      {Date.now() - Date.parse(checked) > 900000
                        ? " · STALE CHECK — refresh the source"
                        : ""}
                    </Text>
                  ) : null;
                })()}
                <Text style={styles.text}>{officialDetail.description}</Text>
                {officialDetail.geometry === null && (
                  <Text style={styles.text}>
                    Regional alert · the source supplied no map boundary.
                  </Text>
                )}
                <Text style={styles.text}>
                  Source reports may change. Use official instructions for
                  decisions; this app does not dispatch emergency services.
                </Text>
                <Button
                  label="Read official source"
                  onPress={() => {
                    void Linking.openURL(officialDetail.sourceUrl).catch(() =>
                      setMessage("Unable to open the official source."),
                    );
                  }}
                />
                <Button
                  label="Close official report"
                  onPress={() => setOfficialDetail(null)}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0006",
          }}
        >
          <ScrollView
            style={{
              maxHeight: "80%",
              backgroundColor: "#10282c",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            contentContainerStyle={{ padding: 22, paddingBottom: 45, gap: 12 }}
          >
            {selected && (
              <>
                <ObservationDetails report={selected} />
                {(["misleading", "dangerous", "abusive"] as const).map(
                  (reason) => (
                    <Button
                      key={reason}
                      label={`Flag ${reason}`}
                      onPress={() => {
                        void flag(selected.id, reason)
                          .then(() => setMessage("Flag submitted for review."))
                          .catch((e) => setMessage(String(e)));
                        setSelected(null);
                      }}
                    />
                  ),
                )}
                <Button label="Close" onPress={() => setSelected(null)} />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
