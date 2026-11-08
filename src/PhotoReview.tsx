import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Text, View } from "react-native";
import { photoForReport } from "./ObservationPhoto";
import { supabase } from "./api";
import { Button, styles } from "./ui";
export default function PhotoReview({
  reportId,
  reason,
}: {
  reportId: string;
  reason: string;
}) {
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["report-photo", reportId],
    queryFn: () => photoForReport(reportId),
    enabled: open,
    staleTime: 45000,
    refetchInterval: open ? 50000 : false,
    retry: 1,
  });
  async function decide(decision: string) {
    if (!supabase || !q.data) return;
    const { error } = await supabase.rpc("moderate_media", {
      media: q.data.id,
      decision,
      explanation: reason,
    });
    setMessage(error?.message ?? "Photo decision recorded.");
    await client.invalidateQueries({ queryKey: ["report-photo", reportId] });
  }
  return (
    <View style={{ gap: 8 }}>
      <Button
        label={open ? "Close photo review" : "Review attached photo"}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          {q.isFetching && <Text style={styles.text}>Loading photo…</Text>}
          {q.error && (
            <Text style={styles.text}>
              Photo unavailable. Check the upload function deployment.
            </Text>
          )}
          {q.data === null && (
            <Text style={styles.text}>No attached photo.</Text>
          )}
          {q.data && (
            <>
              <Image
                accessibilityLabel="Photo awaiting review"
                source={{ uri: q.data.url }}
                style={{ height: 200, width: "100%" }}
                resizeMode="contain"
              />
              <Text style={styles.text}>
                Photo status: {q.data.status}. Check faces, plates, sensitive
                places and misleading content before approving.
              </Text>
              <Button
                label="Approve photo for public viewing"
                disabled={reason.trim().length < 5}
                onPress={() => {
                  void decide("approve");
                }}
              />
              <Button
                label="Hide photo"
                disabled={reason.trim().length < 5}
                onPress={() => {
                  void decide("hide");
                }}
              />
            </>
          )}
          {message.length > 0 && <Text style={styles.text}>{message}</Text>}
        </>
      )}
    </View>
  );
}
