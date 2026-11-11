import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import ObservationPreview from "../ObservationPreview";
import { mapSymbols } from "../mapSymbols";
import ActivitySheet from "../ActivitySheet";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Observation | null>(null);
  const [center, setCenter] = useState<[number, number]>([-149.9, 61.218]);
  const [message, setMessage] = useState("");
  const [viewport, setViewport] = useState<{
    center: [number, number];
    bounds: MapBounds | null;
  }>({ center: [-149.9, 61.218], bounds: null });
  const [activityOpen, setActivityOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [demoInfo, setDemoInfo] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
    setActivityOpen(false);
    setDetailsOpen(false);
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
      setSearchPlace(null);
      setCenter([p.coords.longitude, p.coords.latitude]);
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#071719" }}>
      <NativeMap
        attributionBottom={
          Math.max(insets.bottom, 12) + (selected ? height * 0.38 + 12 : 150)
        }
        controlsHidden={activityOpen || !!selected}
        center={center}
        selectedPlace={searchPlace}
        selectedId={selected?.id}
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
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          right: 16,
          gap: 8,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
          <View style={{ flex: 1 }}>
            <PlaceSearch
              focus={viewport.center}
              onChoose={(place) => {
                setSelected(null);
                setDetailsOpen(false);
                setSearchPlace(place);
                setCenter([place.longitude, place.latitude]);
                setViewport({
                  center: [place.longitude, place.latitude],
                  bounds: null,
                });
                setActivityOpen(false);
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            onPress={() => router.push("/account")}
            style={{
              width: 48,
              height: 50,
              borderRadius: 16,
              backgroundColor: "#10282c",
              borderWidth: 1,
              borderColor: "#345056",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#d0e8e3", fontSize: 25 }}>◎</Text>
          </Pressable>
        </View>
        {!supabase && (
          <View style={{ alignItems: "flex-start" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About demo mode"
              onPress={() => setDemoInfo(true)}
              style={{
                backgroundColor: "#10282c",
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#edc88e",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                DEMO
              </Text>
            </Pressable>
          </View>
        )}
        {searchPlace && (
          <View
            style={{
              backgroundColor: "#10282c",
              borderRadius: 14,
              padding: 12,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: "#e6f4ef", fontWeight: "600" }}
              >
                {searchPlace.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: "#9ab3b7", fontSize: 11 }}
              >
                Place reference only · no observation created
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selected place"
              onPress={() => setSearchPlace(null)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#c8e1dc", fontSize: 22 }}>×</Text>
            </Pressable>
          </View>
        )}
        {!!message && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            onPress={() => setMessage("")}
            style={{
              backgroundColor: "#10282c",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          </Pressable>
        )}
      </View>
      {!activityOpen && !selected && (
        <View
          style={{ position: "absolute", right: 16, top: height * 0.43 + 108 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Locate me"
            onPress={() => void locate()}
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: "#10282c",
              borderWidth: 1,
              borderColor: "#79b8b0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#e6f5f0", fontSize: 25 }}>⌖</Text>
          </Pressable>
        </View>
      )}
      {!activityOpen && !selected && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: Math.max(insets.bottom, 12) + 84,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Layers"
            onPress={() => setLayersOpen(true)}
            style={{
              paddingHorizontal: 17,
              minHeight: 46,
              borderRadius: 23,
              backgroundColor: "#10282c",
              borderWidth: 1,
              borderColor: filters === "all" ? "#345056" : "#9ce5d9",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#c9e6df", fontWeight: "600" }}>
              Layers{filters !== "all" ? " •" : ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report an observation"
            onPress={() => router.push("/report")}
            style={{
              paddingHorizontal: 20,
              minHeight: 48,
              borderRadius: 24,
              backgroundColor: "#b5e7d8",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#12302f", fontWeight: "700", fontSize: 15 }}>
              ＋ Report
            </Text>
          </Pressable>
        </View>
      )}
      {!selected && (
        <ActivitySheet
          expanded={activityOpen}
          onChange={setActivityOpen}
          bottom={Math.max(insets.bottom, 12)}
          maxHeight={height * 0.48}
          title={
            q.isLoading
              ? "Loading nearby observations…"
              : q.error || spatial.error
                ? "Nearby observations · update unavailable"
                : `Nearby observations · ${nearbyReports.length}${filters !== "all" ? " · filtered" : ""}`
          }
        >
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{
              padding: 16,
              paddingTop: 0,
              paddingBottom: 24,
              gap: 12,
            }}
            nestedScrollEnabled
          >
            <Text style={[styles.text, { fontSize: 12 }]}>
              In this map area · newest first
              {!supabase ? " · fictional demo reports" : " · up to 300 loaded"}
            </Text>
            {q.isLoading && (
              <Text style={styles.text}>Loading observations…</Text>
            )}
            {q.error && (
              <Button
                label="Unable to load · Retry"
                onPress={() => void q.refetch()}
              />
            )}
            {spatial.isFetching && (
              <Text style={styles.text}>Updating this map area…</Text>
            )}
            {spatial.error && (
              <Button
                label="Nearby reports unavailable · Retry"
                onPress={() => void spatial.refetch()}
              />
            )}
            {feeds.selected.some((id) => feeds.queries[id].isError) && (
              <Text style={{ color: "#edc88e" }}>
                Official source refresh failed · check Layers.
              </Text>
            )}
            {feeds.items.map((item) => (
              <Button
                key={item.id}
                label={`OFFICIAL · ${item.title}`}
                onPress={() => setOfficialDetail(item)}
              />
            ))}
            {nearbyReports.map((report) => (
              <ObservationCard
                key={report.id}
                report={report}
                onPress={() => selectReport(report)}
                distance={distanceKm(report, {
                  longitude: viewport.center[0],
                  latitude: viewport.center[1],
                })}
              />
            ))}
            {!q.isLoading &&
              !spatial.isFetching &&
              !q.error &&
              !spatial.error &&
              nearbyReports.length === 0 && (
                <Text style={styles.text}>
                  No observations in this map area. Zoom out, change the filter
                  in Layers, or explore another place.
                </Text>
              )}
          </ScrollView>
        </ActivitySheet>
      )}
      {selected && (
        <ObservationPreview
          report={selected}
          onClose={() => {
            setSelected(null);
            setDetailsOpen(false);
          }}
          onExpand={() => setDetailsOpen(true)}
          bottom={Math.max(insets.bottom, 12)}
          maxHeight={height * 0.38}
        />
      )}
      <Modal
        visible={layersOpen}
        animationType="slide"
        onRequestClose={() => setLayersOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 40 }}
          >
            <Button label="Back to map" onPress={() => setLayersOpen(false)} />
            <Text style={styles.heading}>Layers</Text>
            <ChoiceSheet
              label="Observation category"
              value={filters}
              options={[
                { value: "all", label: "All categories" },
                ...catalog.domains.map((d) => ({
                  value: d.id,
                  label: d.label,
                })),
              ]}
              onChange={setFilters}
            />
            <Text style={styles.text}>
              Filter community observations without changing the report itself.
            </Text>
            <Button
              label="Official sources & map information"
              onPress={() => {
                setLayersOpen(false);
                router.push("/sources");
              }}
            />
            <Text style={[styles.heading, { fontSize: 22 }]}>Map legend</Text>
            {catalog.domains.map((kind) => (
              <View
                key={kind.id}
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: kind.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={mapSymbols[kind.id].image}
                    style={{ width: 21, height: 21 }}
                    accessible={false}
                  />
                </View>
                <Text style={styles.text}>{kind.label}</Text>
              </View>
            ))}
            <Text style={styles.text}>
              Color indicates report type, never verification or severity.
              Individual markers keep their colors at every zoom level.
              White/purple marks official sources.
            </Text>
            {Object.entries(riskPresentation)
              .filter(([id]) => id !== "none")
              .map(([id, r]) => (
                <Text key={id} style={{ color: r.color }}>
                  {r.label} · outer ring
                </Text>
              ))}
            <Text style={styles.text}>
              Expired assessments lose their ring. No ring does not mean safe.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={demoInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setDemoInfo(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0009",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Demo mode</Text>
            <Text style={styles.text}>
              Map observations are fictional examples. Your demo reports stay on
              this device and are not sent to staff or emergency services.
            </Text>
            <Button label="Back to map" onPress={() => setDemoInfo(false)} />
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
        visible={!!selected && detailsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsOpen(false)}
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
                <Button
                  label="Back to preview"
                  onPress={() => setDetailsOpen(false)}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
