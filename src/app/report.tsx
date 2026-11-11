import { useState, useRef } from "react";
import { Image, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Category,
  categories,
  ReportLocation,
  reportPresets,
  ReportKind,
  reportKinds,
  defaultKind,
  ReportDetails,
} from "../domain";
import { submit, supabase, attachPhoto } from "../api";
import { Button, styles } from "../ui";
import LocationPicker from "../LocationPicker";
import ObservationTime from "../ObservationTime";
import { pickPhoto, PreparedPhoto } from "../photos";
export default function Report() {
  const [category, setCategory] = useState<Category>("Safety"),
    [kind, setKind] = useState<ReportKind>("hazard");
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState("");
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [animal, setAnimal] = useState(""),
    [count, setCount] = useState("");
  const [surface, setSurface] = useState("Unknown"),
    [visibility, setVisibility] = useState("Unknown");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [preparing, setPreparing] = useState(false),
    [consent, setConsent] = useState(false);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [savedId, setSavedId] = useState<string | null>(null);
  const client = useQueryClient();
  const saving = useRef(false);
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (!location)
        throw Error("Choose where you observed this before submitting.");
      if (photo && !consent)
        throw Error("Confirm your photo is safe to share or remove it.");
      const details: ReportDetails =
        kind === "wildlife"
          ? {
              ...(animal.trim() ? { animal: animal.trim() } : {}),
              ...(count.trim() ? { count: Number(count) } : {}),
            }
          : kind === "road"
            ? { surface, visibility }
            : {};
      const result = await submit(
        {
          category,
          kind,
          title,
          description,
          latitude: location.latitude,
          longitude: location.longitude,
          place_name: location.name,
          observed_at: observedAt ?? new Date().toISOString(),
          details,
        },
        photo ?? undefined,
      );
      await client.invalidateQueries({ queryKey: ["observations"] });
      if (result.photoError) {
        setSavedId(result.id);
        setMessage(
          `Your report is saved. The photo was not attached: ${result.photoError}`,
        );
      } else router.back();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function selectPhoto() {
    setPreparing(true);
    setMessage("");
    try {
      const selected = await pickPhoto();
      if (selected) {
        setPhoto(selected);
        setConsent(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare this photo.",
      );
    } finally {
      setPreparing(false);
    }
  }
  async function retryPhoto() {
    if (!savedId || !photo) return;
    setBusy(true);
    try {
      await attachPhoto(savedId, photo.base64);
      await client.invalidateQueries({ queryKey: ["observations"] });
      router.back();
    } catch (error) {
      setMessage(`The report remains saved. ${String(error)}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#080d1a" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: "#a99bdf", letterSpacing: 4, fontWeight: "700", fontSize: 16 }}>N U N A</Text>
      <Button label="← Back to map" onPress={() => router.back()} />
      <Text style={styles.heading}>Share an observation</Text>
      <Text style={{ color: "#a99bdf", letterSpacing: 2, fontSize: 11 }}>ALASKA · COMMUNITY INTELLIGENCE</Text>
      <Text style={styles.text}>
        {supabase
          ? "Community observation"
          : "DEMO · Saved only on this device"}
        . Reports begin unverified. Avoid names, private homes, vulnerable
        people and sensitive locations. Only an approximate area is shared.
      </Text>
      {savedId ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.text}>
            {message}
          </Text>
          <Button
            label={busy ? "Retrying…" : "Retry photo attachment"}
            disabled={busy}
            onPress={() => {
              void retryPhoto();
            }}
          />
          <Button
            label="Continue to map without photo"
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <View key={c} style={{ minWidth: "30%", flexGrow: 1 }}>
                <Button
                  label={`${c === category ? "● " : ""}${c}`}
                  onPress={() => {
                    setCategory(c);
                    setKind(defaultKind[c]);
                  }}
                />
              </View>
            ))}
          </View>
          <Text style={styles.text}>
            What did you notice? Pick a starting title or write your own.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {reportPresets[category].map((preset) => (
              <Button
                key={preset.title}
                label={preset.title}
                onPress={() => {
                  setTitle(preset.title);
                  setKind(preset.kind);
                  if (preset.title === "Whale sighting" && !animal)
                    setAnimal("Whale");
                }}
              />
            ))}
          </View>
          <Text style={styles.text}>
            Report type · matching color on the map
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(reportKinds) as ReportKind[])
              .filter((key) => reportKinds[key].category === category)
              .map((key) => (
                <Button
                  key={key}
                  label={`${key === kind ? "● " : ""}${reportKinds[key].label}`}
                  onPress={() => setKind(key)}
                />
              ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: reportKinds[kind].color,
              }}
            />
            <Text style={styles.text}>{reportKinds[kind].label}</Text>
          </View>
          <TextInput
            accessibilityLabel="Title"
            placeholder="Observation title"
            placeholderTextColor="#9ab3b7"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            accessibilityLabel="Description"
            placeholder="What did you observe?"
            placeholderTextColor="#9ab3b7"
            style={[styles.input, { minHeight: 120 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={2000}
          />
          {kind === "wildlife" && (
            <View style={styles.card}>
              <Text style={styles.text}>Wildlife details · optional</Text>
              <TextInput
                accessibilityLabel="Animal"
                placeholder="What animal?"
                placeholderTextColor="#9ab3b7"
                style={styles.input}
                value={animal}
                onChangeText={setAnimal}
                maxLength={80}
              />
              <TextInput
                accessibilityLabel="Approximate animal count"
                placeholder="Roughly how many?"
                placeholderTextColor="#9ab3b7"
                style={styles.input}
                value={count}
                onChangeText={setCount}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          )}
          {kind === "road" && (
            <View style={styles.card}>
              <Text style={styles.text}>Road surface</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {["Unknown", "Dry", "Wet", "Snow", "Ice"].map((choice) => (
                  <Button
                    key={choice}
                    label={`${surface === choice ? "● " : ""}${choice}`}
                    onPress={() => setSurface(choice)}
                  />
                ))}
              </View>
              <Text style={styles.text}>Visibility</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {["Unknown", "Good", "Reduced", "Very poor"].map((choice) => (
                  <Button
                    key={choice}
                    label={`${visibility === choice ? "● " : ""}${choice}`}
                    onPress={() => setVisibility(choice)}
                  />
                ))}
              </View>
            </View>
          )}
          <ObservationTime value={observedAt} onChange={setObservedAt} />
          <LocationPicker value={location} onChange={setLocation} />
          <View style={styles.card}>
            <Text style={[styles.heading, { fontSize: 22 }]}>
              Add a photo · optional
            </Text>
            <Text style={styles.text}>
              Avoid faces, license plates and private or sensitive locations.
              Location metadata is removed.{" "}
              {supabase
                ? "Uploaded photos stay private until a moderator reviews them."
                : "Demo photos stay on this device."}
            </Text>
            {photo && (
              <Image
                accessibilityLabel="Selected photo preview"
                source={{ uri: photo.uri }}
                style={{ width: "100%", height: 180, borderRadius: 12 }}
                resizeMode="contain"
              />
            )}
            <Button
              label={
                preparing
                  ? "Preparing photo…"
                  : photo
                    ? "Choose another photo"
                    : "Choose photo"
              }
              disabled={preparing || busy}
              onPress={() => {
                void selectPhoto();
              }}
            />
            {photo && (
              <>
                <Button
                  label="Remove attachment"
                  onPress={() => {
                    setPhoto(null);
                    setConsent(false);
                  }}
                />
                <Button
                  label={`${consent ? "☑" : "☐"} I checked this photo for sensitive details`}
                  onPress={() => setConsent(!consent)}
                />
              </>
            )}
          </View>
          {message.length > 0 && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          <Button
            label={busy ? "Saving…" : "Submit unverified observation"}
            disabled={
              busy || preparing || location === null || (!!photo && !consent)
            }
            onPress={() => {
              void save();
            }}
          />
        </>
      )}
    </ScrollView>
  );
}
