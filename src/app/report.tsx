import { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Category, categories, ReportLocation } from "../domain";
import { submit, supabase } from "../api";
import { Button, styles } from "../ui";
import LocationPicker from "../LocationPicker";
export default function Report() {
  const [category, setCategory] = useState<Category>("Safety");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  async function save() {
    setBusy(true);
    try {
      if (!location)
        throw new Error("Choose where you observed this before submitting.");
      await submit({
        category,
        title,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      await client.invalidateQueries({ queryKey: ["observations"] });
      router.back();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label="← Back to map" onPress={() => router.back()} />
      <Text style={styles.heading}>Share what you see.</Text>
      <Text style={styles.text}>
        {supabase
          ? "Community observation"
          : "DEMO · Saved only on this device"}
        . Reports begin unverified. Do not include names, private homes,
        vulnerable people, or sensitive incident locations. Only an approximate
        area is shared.
      </Text>
      {categories.map((c) => (
        <Button
          key={c}
          label={`${c === category ? "● " : ""}${c}`}
          onPress={() => setCategory(c)}
        />
      ))}
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
      <LocationPicker value={location} onChange={setLocation} />
      <Text style={styles.text}>
        Photo attachments are deferred. Never upload identifying or sensitive
        images.
      </Text>
      {!!message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
      <Button
        label={busy ? "Saving…" : "Submit unverified observation"}
        disabled={busy || location === null}
        onPress={() => {
          void save();
        }}
      />
    </ScrollView>
  );
}
