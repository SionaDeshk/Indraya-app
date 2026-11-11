import { useState } from "react";
import NunaWelcome from "../NunaWelcome";
import NunaMark from "../NunaMark";
import { View, Text, ScrollView, Modal, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import {
  categories,
  Observation,
  age,
  MapBounds,
  normalizeBounds,
  withinBounds,
  distanceKm,
  observedTime,
  reportKinds,
  reportAppearance,
} from "../domain";
import { observations, flag, supabase } from "../api";
import { Button, styles } from "../ui";
import PlaceSearch from "../AlaskaPlaceSearch";
import ObservationPhoto from "../ObservationPhoto";
import ObservationCard from "../ObservationCard";
import NativeMap from "../NativeMap";
import * as Linking from "expo-linking";
import { useOfficialFeeds } from "../official/useOfficialFeeds";
import { OfficialItem } from "../official/adapters";
export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [filters, setFilters] = useState<string[]>([...categories, "Wildlife"]);
  const [selected, setSelected] = useState<Observation | null>(null);
  const [center, setCenter] = useState<[number, number]>([-149.9, 61.218]);
  const [message, setMessage] = useState("");
  const [viewport, setViewport] = useState<{
    center: [number, number];
    bounds: MapBounds | null;
  }>({ center: [-149.9, 61.218], bounds: null });
  const [nearby, setNearby] = useState(false);
  const [observationsExpanded, setObservationsExpanded] = useState(false);
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
  const visible = loadedReports.filter((o) => (o.kind === "wildlife" ? filters.includes("Wildlife") : filters.includes(o.category)));
  const nearbyReports = (
    supabase && viewport.bounds
      ? (spatial.data ?? []).filter((report) =>
          (report.kind === "wildlife" ? filters.includes("Wildlife") : filters.includes(report.category)),
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
              NUNA
            </Text>
            <Text style={{ color: "#9bc9c6" }}>
              Alaska in real time.
            </Text>
          </View>
          <Button label="Account" onPress={() => router.push("/account")} />
        </View>
        <PlaceSearch
          focus={viewport.center}
          onChoose={(place) => {
            setCenter([place.longitude, place.latitude]);
            setViewport({
              center: [place.longitude, place.latitude],
              bounds: null,
            });
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {[...categories, "Wildlife"].map((c) => (
            <Button
              key={c}
              label={`${filters.includes(c) ? "●" : "○"} ${c === "Safety" ? "Incidents" : c}`}
              onPress={() =>
                setFilters(
                  filters.includes(c)
                    ? filters.filter((x) => x !== c)
                    : [...filters, c],
                )
              }
            />
          ))}
        </View>
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
          style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", alignItems: "center" }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Locate me"
            onPress={() => { void locate(); }}
            style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#05090e", borderWidth: 1, borderColor: "#627080", alignItems: "center", justifyContent: "center" }}
          >
            <NunaMark size={49} />
          </Pressable>
          <Button
            label="Layers & sources"
            onPress={() => router.push("/sources")}
          />
        </View>
        <View style={[styles.card, { padding: observationsExpanded ? 18 : 12, gap: observationsExpanded ? 12 : 0 }]}>
          <Button
            label={observationsExpanded
              ? "⌄  " + visible.length + " observations · Minimize"
              : "⌃  " + visible.length + " observations · Expand"}
            onPress={() => setObservationsExpanded((expanded) => !expanded)}
          />
          {observationsExpanded && (
            <>
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
            </>
          )}
        </View>
        {!observationsExpanded && (
          <Button label="＋ Share observation" onPress={() => router.push("/report")} />
        )}
      </View>
      {showWelcome && (
        <NunaWelcome
          onOpenMap={() => setShowWelcome(false)}
          onReport={() => { setShowWelcome(false); router.push("/report"); }}
          onLayers={() => { setShowWelcome(false); router.push("/sources"); }}
        />
      )}
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
            {Object.values(reportKinds).map((kind) => (
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
                <Text style={{ color: "#e9c78f" }}>
                  {reportAppearance(selected).label} ·{" "}
                  {selected.verification.toUpperCase()}
                </Text>
                <Text style={styles.heading}>{selected.title}</Text>
                <Text style={styles.text}>
                  {selected.place_name || "Approximate map location"} · Observed{" "}
                  {age(observedTime(selected))}
                </Text>
                <Text style={styles.text}>{selected.description}</Text>
                <ObservationPhoto report={selected} />
                {(!!selected.details?.animal ||
                  selected.details?.count !== undefined) && (
                  <Text style={styles.text}>
                    Animal: {selected.details?.animal || "Unspecified wildlife"}
                    {selected.details?.count
                      ? ` · about ${selected.details?.count}`
                      : ""}
                  </Text>
                )}
                {selected.details?.surface && (
                  <Text style={styles.text}>
                    Surface: {selected.details.surface} · Visibility:{" "}
                    {selected.details.visibility || "Unknown"}
                  </Text>
                )}
                <Text style={styles.text}>
                  {selected.source} · Submitted {age(selected.created_at)}
                </Text>
                <Text style={styles.text}>
                  Never rely on community reports for emergency decisions. In an
                  emergency, call 911.
                </Text>
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
