import * as Linking from "expo-linking";
import { recreationReferences } from "./recreationPlaces";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, TextInput, View, ScrollView } from "react-native";
import { ReportLocation } from "./domain";
import { PlaceResult, searchPlaces } from "./placeSearch";
import { initialPlaceCount } from "./searchDomain";
import { Button, styles } from "./ui";
export default function PlaceSearch({
  onChoose,
  focus = [-149.9, 61.218],
  label = "Search places",
}: {
  onChoose: (place: ReportLocation) => void;
  focus?: [number, number];
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const request = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      request.current++;
      abort.current?.abort();
    },
    [],
  );
  function change(value: string) {
    request.current++;
    abort.current?.abort();
    setQuery(value);
    setShowAll(false);
    setResults([]);
    setMessage("");
    setBusy(false);
    setSearched(false);
  }
  async function search() {
    const id = ++request.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setResults([]);
    setSearched(false);
    setMessage("");
    try {
      const rows = await searchPlaces(query, focus, controller.signal);
      if (id === request.current) {
        setResults(rows);
        setSearched(true);
      }
    } catch (error) {
      if (id === request.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to search right now. Check your connection and try again.",
        );
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <TextInput
        accessibilityLabel={label}
        placeholder="Search Alaska"
        placeholderTextColor="#9ab3b7"
        value={query}
        onChangeText={change}
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={() => {
          if (query.trim().length >= 3 && !busy) void search();
        }}
        autoCorrect={false}
        maxLength={160}
      />
      {query.trim().length > 0 && (
        <View style={[styles.card, { padding: 12 }]}>
          <Button
            label={busy ? "Searching…" : "Search"}
            disabled={busy || query.trim().length < 3}
            onPress={() => {
              void search();
            }}
          />
          {busy && (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              Searching…
            </Text>
          )}
          {recreationReferences(query).map((reference) => (
            <View key={reference.url} style={{ gap: 4 }}>
              <Button
                label={reference.label}
                onPress={() => {
                  void Linking.openURL(reference.url).catch(() =>
                    setMessage("Could not open the route reference."),
                  );
                }}
              />
              <Text style={[styles.text, { fontSize: 12 }]}>
                External guide · exact route pin not verified in Indraya
              </Text>
            </View>
          ))}
          <ScrollView
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {(showAll
              ? results
              : results.slice(0, initialPlaceCount(results, query))
            ).map((place, i) => (
              <View
                key={`${place.name}:${place.latitude}:${i}`}
                style={{ gap: 4, marginBottom: 8 }}
              >
                <Button
                  label={place.name}
                  onPress={() => {
                    onChoose(place);
                    change("");
                    Keyboard.dismiss();
                  }}
                />
                <Text style={[styles.text, { fontSize: 12 }]}>
                  {place.featureType?.replace(/_/g, " ") || "Place"}
                  {place.context ? ` · ${place.context}` : ""}
                </Text>
              </View>
            ))}
          </ScrollView>
          {!showAll && results.length > initialPlaceCount(results, query) && (
            <Button
              label={`More places (${results.length - initialPlaceCount(results, query)})`}
              onPress={() => setShowAll(true)}
            />
          )}
          {searched && results.length === 0 && (
            <Text style={styles.text}>
              No places found in Alaska. Try a nearby town or a more specific
              name.
            </Text>
          )}
          {message.length > 0 && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          <Text style={[styles.text, { fontSize: 12 }]}>
            © OpenStreetMap contributors. Search uses your words and approximate
            map area. Check the town or region before choosing.
          </Text>
        </View>
      )}
    </View>
  );
}
