import useActorBoundary from "./useActorBoundary";
import MediaPreview from "./MediaPreview";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
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
  const boundary = useActorBoundary();
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["report-photo", reportId, boundary.actor],
    queryFn: () => photoForReport(reportId),
    enabled: open && boundary.actor !== undefined && !boundary.invalidated,
    staleTime: 45000,
    refetchInterval: open ? 50000 : false,
    retry: 1,
  });
  async function decide(decision: string) {
    if (!supabase || !q.data || !boundary.current()) return;
    const { error } = await supabase.rpc("moderate_media", {
      media: q.data.id,
      decision,
      explanation: reason,
    });
    setMessage(error?.message ?? "Attachment decision recorded.");
    await client.invalidateQueries({ queryKey: ["report-photo", reportId] });
  }
  if (boundary.invalidated) return null;
  return (
    <View style={{ gap: 8 }}>
      <Button
        label={open ? "Close attachment review" : "Review attachment"}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          {q.isFetching && <Text style={styles.text}>Loading attachment…</Text>}
          {q.error && (
            <Text style={styles.text}>
              Attachment unavailable. Check the upload function deployment.
            </Text>
          )}
          {q.data === null && <Text style={styles.text}>No attachment.</Text>}
          {q.data && (
            <>
              <MediaPreview
                uri={q.data.url}
                kind={q.data.kind}
                label="Attachment awaiting review"
              />
              <Text style={styles.text}>
                Attachment status: {q.data.status}. Watch the whole clip with
                sound when applicable. Check faces, plates, voices, sensitive
                places and misleading content before approving.
              </Text>
              <Button
                label="Approve attachment for public viewing"
                disabled={reason.trim().length < 5}
                onPress={() => {
                  void decide("approve");
                }}
              />
              <Button
                label="Hide attachment"
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
