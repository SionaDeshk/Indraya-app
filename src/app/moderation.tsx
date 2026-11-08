import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../api";
import PhotoReview from "../PhotoReview";
import { Button, styles } from "../ui";
type Item = { id: string; title: string; status: string };
export default function Moderation() {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const q = useQuery<Item[]>({
    queryKey: ["review-queue"],
    retry: false,
    queryFn: async () => {
      if (!supabase)
        throw Error(
          "Connect Supabase and sign in with a server-provisioned moderator account.",
        );
      const { data, error } = await supabase.rpc("review_queue");
      if (error) throw error;
      return data ?? [];
    },
  });
  async function decide(id: string, decision: string) {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("moderate_report", {
        report: id,
        decision,
        explanation: reason,
      });
      if (error) throw error;
      setMessage("Decision recorded.");
      await client.invalidateQueries({ queryKey: ["review-queue"] });
      await client.invalidateQueries({ queryKey: ["observations"] });
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
    >
      <Button label="← Back" onPress={() => router.back()} />
      <Text style={styles.heading}>Moderation</Text>
      <Text style={styles.text}>
        Server-authorized review · approval records a human review, never an
        emergency confirmation.
      </Text>
      {q.isLoading && (
        <Text style={styles.text}>Checking moderator access…</Text>
      )}
      {q.error && (
        <Text accessibilityRole="alert" style={styles.text}>
          {q.error.message}
        </Text>
      )}
      <TextInput
        accessibilityLabel="Moderation reason"
        placeholder="Reason for this decision (5+ characters)"
        placeholderTextColor="#9ab3b7"
        value={reason}
        onChangeText={setReason}
        style={styles.input}
      />
      <Text style={styles.text}>{message}</Text>
      {q.data?.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.text}>
            {item.title} · {item.status}
          </Text>
          <PhotoReview reportId={item.id} reason={reason} />
          {["approve", "hide", "review"].map((decision) => (
            <Button
              key={decision}
              label={decision}
              disabled={busy || reason.trim().length < 5}
              onPress={() => {
                void decide(item.id, decision);
              }}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
