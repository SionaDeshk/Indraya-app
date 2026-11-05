import { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Category, categories } from "../domain";
import { submit, supabase } from "../api";
import { Button, styles } from "../ui";
export default function Report() {
  const [category, setCategory] = useState<Category>("Safety");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("61.22");
  const [lon, setLon] = useState("-149.90");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  async function save() {
    setBusy(true);
    try {
      if (!lat.trim() || !lon.trim())
        throw new Error("Enter both observation coordinates.");
      await submit({
        category,
        title,
        description,
        latitude: Number(lat),
        longitude: Number(lon),
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
    <ScrollView contentContainerStyle={styles.page}>
      <Button label="← Back to map" onPress={() => router.back()} />
      <Text style={styles.heading}>Share what you see.</Text>
      <Text style={styles.text}>
        {supabase
          ? "Community observation"
          : "DEMO · Saved only on this device"}
        . Reports begin unverified. Do not include names, private homes,
        vulnerable people, or sensitive incident locations. Public coordinates
        are rounded to approximately 1 km.
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
      <Text style={styles.text}>
        Approximate observation location · edit coordinates deliberately
      </Text>
      <TextInput
        accessibilityLabel="Latitude"
        style={styles.input}
        value={lat}
        onChangeText={setLat}
        keyboardType="numbers-and-punctuation"
      />
      <TextInput
        accessibilityLabel="Longitude"
        style={styles.input}
        value={lon}
        onChangeText={setLon}
        keyboardType="numbers-and-punctuation"
      />
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
        disabled={busy}
        onPress={() => {
          void save();
        }}
      />
    </ScrollView>
  );
}
