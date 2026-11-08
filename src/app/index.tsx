import { useState } from "react";
import { View, Text, TextInput, ScrollView, Modal } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { categories, Observation, age, places } from "../domain";
import { observations, flag, supabase } from "../api";
import { Button, styles } from "../ui";
import NativeMap from "../NativeMap";
import * as Linking from "expo-linking";
import { useOfficialFeeds } from "../official/useOfficialFeeds";
import { OfficialItem } from "../official/adapters";
export default function Home() {
  const [filters, setFilters] = useState<string[]>(categories);
  const [selected, setSelected] = useState<Observation | null>(null);
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState<[number, number]>([-149.9, 61.218]);
  const [message, setMessage] = useState("");
  const [officialDetail, setOfficialDetail] = useState<OfficialItem | null>(
    null,
  );
  const feeds = useOfficialFeeds();
  const q = useQuery({ queryKey: ["observations"], queryFn: observations });
  const visible = (q.data ?? []).filter((o) => filters.includes(o.category));
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
        onSelect={setSelected}
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
        <TextInput
          accessibilityLabel="Search Alaska places"
          placeholder="Search Alaska · places & features"
          placeholderTextColor="#9ab3b7"
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
        {search.length > 0 && (
          <View style={styles.card}>
            {places
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => (
                <Button
                  key={p.name}
                  label={p.name}
                  onPress={() => {
                    setCenter([p.longitude, p.latitude]);
                    setSearch("");
                  }}
                />
              ))}
            <Text style={styles.text}>
              Offline starter gazetteer · seven Alaska places
            </Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {categories.map((c) => (
            <Button
              key={c}
              label={`${filters.includes(c) ? "●" : "○"} ${c}`}
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
        style={{
          position: "absolute",
          bottom: 35,
          left: 20,
          right: 20,
          gap: 10,
        }}
      >
        <View
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
          <ScrollView horizontal>
            {visible.map((o) => (
              <Button
                key={o.id}
                label={o.title}
                onPress={() => setSelected(o)}
              />
            ))}
          </ScrollView>
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
          <View style={[styles.card, { paddingBottom: 45 }]}>
            {selected && (
              <>
                <Text style={{ color: "#e9c78f" }}>
                  {selected.category} · {selected.verification.toUpperCase()}
                </Text>
                <Text style={styles.heading}>{selected.title}</Text>
                <Text style={styles.text}>{selected.description}</Text>
                <Text style={styles.text}>
                  {selected.source} · {age(selected.created_at)}
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
          </View>
        </View>
      </Modal>
    </View>
  );
}
