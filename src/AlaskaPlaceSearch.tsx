import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, TextInput, View, ScrollView, Pressable } from "react-native";
import { ReportLocation } from "./domain";
import { PlaceResult, savedPlaces, searchPlaces } from "./placeSearch";
import { Button, styles } from "./ui";
export default function PlaceSearch({
  onChoose,
  focus = [-149.9, 61.218],
  label = "Search Alaska places",
  onLocate,
  onPhoto,
}: {
  onChoose: (place: ReportLocation) => void;
  focus?: [number, number];
  label?: string;
  onLocate?: () => void;
  onPhoto?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<PlaceResult[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
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
    setRemote([]);
    setMessage("");
    setBusy(false);
    setSearched(false);
  }
  async function online() {
    const id = ++request.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setMessage("");
    try {
      const rows = await searchPlaces(query, focus, controller.signal);
      if (id === request.current) {
        setRemote(rows);
        setSearched(true);
      }
    } catch (e) {
      if (id === request.current)
        setMessage(
          e instanceof Error && e.name !== "AbortError"
            ? e.message
            : "Online search timed out. Try again or choose a saved place.",
        );
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  const local = savedPlaces(query);
  const rows = [
    ...local,
    ...remote.filter(
      (p) =>
        !local.some(
          (l) => l.name === p.name && Math.abs(l.latitude - p.latitude) < 0.01,
        ),
    ),
  ];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {onLocate && <Pressable accessibilityRole="button" accessibilityLabel="Locate me" onPress={onLocate} style={{ width: 45, height: 45, borderRadius: 14, backgroundColor: "#18243a", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#d6e9ee", fontSize: 23 }}>⌖</Text></Pressable>}
      <View style={{ flex: 1 }}>
      <TextInput
        accessibilityLabel={label}
        placeholder="Search towns, rivers, glaciers, restaurants…"
        placeholderTextColor="#9ab3b7"
        value={query}
        onChangeText={change}
        style={[styles.input, { paddingVertical: 12 }]}
        returnKeyType="search"
        onSubmitEditing={() => {
          if (query.trim().length >= 3) void online();
        }}
        autoCorrect={false}
      />
      </View>
      {onPhoto && <Pressable accessibilityRole="button" accessibilityLabel="Share photo observation" onPress={onPhoto} style={{ width: 45, height: 45, borderRadius: 14, backgroundColor: "#18243a", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#d6e9ee", fontSize: 22 }}>▣</Text></Pressable>}
      </View>
      {query.trim().length > 0 && (
        <View style={[styles.card, { padding: 12 }]}>
          <Button
            label={busy ? "Searching online…" : "Search online"}
            disabled={busy || query.trim().length < 3}
            onPress={() => {
              void online();
            }}
          />
          <ScrollView
            style={{ maxHeight: 200 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {rows.map((place, i) => (
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
                {place.context && (
                  <Text style={styles.text}>{place.context}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          {rows.length === 0 && (
            <Text style={styles.text}>
              {searched
                ? "No places found. Try the place or business name with a town."
                : "No match in the offline Alaska place list. Search online for more places and businesses."}
            </Text>
          )}
          {message.length > 0 && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          <Text style={[styles.text, { fontSize: 12 }]}>
            Saved Alaska places work offline. Online search: Photon · ©
            OpenStreetMap contributors. Searching sends your words and
            approximate map area to the provider.
          </Text>
        </View>
      )}
    </View>
  );
}
