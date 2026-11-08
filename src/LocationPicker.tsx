import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { places, ReportLocation } from "./domain";
import LocationMap from "./LocationMap";
import { Button, styles } from "./ui";
export default function LocationPicker({
  value,
  onChange,
}: {
  value: ReportLocation | null;
  onChange: (location: ReportLocation) => void;
}) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [draft, setDraft] = useState<ReportLocation | null>(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  function choose(place: ReportLocation) {
    request.current += 1;
    setLocating(false);
    onChange(place);
    setSearch("");
    setMessage("");
  }
  async function locate() {
    const id = ++request.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setLocating(true);
    setMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (id !== request.current) return;
      if (permission.status !== "granted")
        throw new Error(
          "Location access is off. Search for a place or choose a spot on the map instead.",
        );
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  "Your location is taking too long. Search for a place or drop a pin instead.",
                ),
              ),
            15000,
          );
        }),
      ]);
      if (id !== request.current) return;
      choose({
        name: "Current location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      if (id === request.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to find your location. Search for a place or drop a pin instead.",
        );
    } finally {
      clearTimeout(timeout);
      if (id === request.current) setLocating(false);
    }
  }
  const matches = search.trim()
    ? places.filter((place) =>
        place.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : [];
  return (
    <View style={{ gap: 12 }}>
      <Text style={[styles.heading, { fontSize: 22 }]}>
        Where did you see it?
      </Text>
      <Text style={styles.text}>
        Choose where the observation happened. Only an approximate area is
        shared.
      </Text>
      <TextInput
        accessibilityLabel="Search observation location"
        placeholder="Search a place, like Beluga Point"
        placeholderTextColor="#9ab3b7"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />
      {search.trim().length > 0 && (
        <View style={styles.card}>
          {matches.map((place) => (
            <Button
              key={place.name}
              label={place.name}
              onPress={() => choose(place)}
            />
          ))}
          {matches.length === 0 && (
            <Text style={styles.text}>
              No match in the offline Alaska place list. Try another name
              {Platform.OS === "web"
                ? " or use your current location."
                : " or drop a pin on the map."}
            </Text>
          )}
          <Text style={styles.text}>
            Offline Alaska places · not a full address search
          </Text>
        </View>
      )}
      <Button
        label={locating ? "Finding your location…" : "Use my current location"}
        disabled={locating}
        onPress={() => {
          void locate();
        }}
      />
      {Platform.OS !== "web" && (
        <Button
          label="Choose on map"
          onPress={() => {
            request.current += 1;
            setLocating(false);
            setDraft(value);
            setMapOpen(true);
          }}
        />
      )}
      <View style={styles.card}>
        <Text style={styles.text}>
          {value ? `Selected: ${value.name}` : "No location selected yet"}
        </Text>
        {value?.name === "Current location" && (
          <Text style={styles.text}>
            Use this only if you are at the place you observed.
          </Text>
        )}
        <Text style={styles.text}>
          Avoid private homes and sensitive locations.
        </Text>
      </View>
      {message.length > 0 && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
      <Modal
        visible={mapOpen}
        animationType="slide"
        onRequestClose={() => setMapOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
          <View style={{ padding: 20, gap: 10 }}>
            <Text style={[styles.heading, { fontSize: 24 }]}>
              Choose the observation spot
            </Text>
            <Text style={styles.text}>
              Pan and zoom, then tap the map to drop or move the pin.
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <LocationMap location={draft} onPick={setDraft} />
          </View>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: 20, gap: 12 }}
          >
            <Text style={styles.text}>
              {draft
                ? `Selected: ${draft.name}`
                : "Tap the map to select a spot."}
            </Text>
            <Button
              label="Use this location"
              disabled={draft === null}
              onPress={() => {
                if (draft) {
                  choose(draft);
                  setMapOpen(false);
                }
              }}
            />
            <Button label="Cancel" onPress={() => setMapOpen(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
