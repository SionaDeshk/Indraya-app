import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Button, styles } from "../ui";
import { FeedId, officialSources, pendingSources } from "../official/catalog";
import { useOfficialFeeds } from "../official/useOfficialFeeds";
import { age } from "../domain";
export default function Sources() {
  const feeds = useOfficialFeeds();
  const [message, setMessage] = useState("");
  function open(url: string) {
    void Linking.openURL(url).catch(() =>
      setMessage(
        "Unable to open the official website. Try again when connected.",
      ),
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
    >
      <Button label="← Back to map" onPress={() => router.back()} />
      <Text style={styles.heading}>Layers & sources</Text>
      <Text style={styles.text}>
        A topographic map underneath. Community observations and official
        information as separate layers above it.
      </Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Topographic map</Text>
        <Text style={styles.text}>
          Always visible · OpenTopoMap / OpenStreetMap / SRTM. Tile availability
          depends on the provider and connection.
        </Text>
      </View>
      {(Object.keys(officialSources) as FeedId[]).map((id) => {
        const source = officialSources[id],
          query = feeds.queries[id],
          enabled = feeds.selected.includes(id);
        return (
          <View key={id} style={styles.card}>
            <Text style={[styles.heading, { fontSize: 22 }]}>
              {source.label}
            </Text>
            <Text style={styles.text}>
              {source.name} ·{" "}
              {source.validatedAt
                ? enabled
                  ? "Layer on"
                  : "Layer off"
                : "Not connected yet"}
            </Text>
            {!source.validatedAt && (
              <Text style={styles.text}>
                No live data has been loaded. Source access and terms still need
                verification.
              </Text>
            )}
            {!!source.validatedAt && (
              <Button
                label={`${enabled ? "Hide" : "Show"} ${source.label}`}
                onPress={() => feeds.toggle(id)}
              />
            )}
            {enabled && query.isFetching && (
              <Text style={styles.text}>Checking official source…</Text>
            )}
            {enabled && query.error && (
              <>
                <Text accessibilityRole="alert" style={styles.text}>
                  Refresh failed. Any retained data may be stale.
                </Text>
                <Button
                  label="Retry source"
                  onPress={() => {
                    void query.refetch();
                  }}
                />
              </>
            )}
            {enabled && query.data && (
              <Text style={styles.text}>
                Checked {age(query.data.fetchedAt)} · {query.data.items.length}{" "}
                reports. Zero reports does not establish safe conditions.
              </Text>
            )}
            <Button
              label={`Open ${source.name}`}
              onPress={() => open(source.website)}
            />
          </View>
        );
      })}
      {pendingSources.map((source) => (
        <View key={source.name} style={styles.card}>
          <Text style={[styles.heading, { fontSize: 22 }]}>{source.name}</Text>
          <Text style={styles.text}>{source.description}</Text>
          <Button
            label="Open official website"
            onPress={() => open(source.website)}
          />
        </View>
      ))}
      {message.length > 0 && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
      <Text style={styles.text}>
        Not an emergency service. No push alerts or background location tracking
        are enabled.
      </Text>
    </ScrollView>
  );
}
