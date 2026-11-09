import { removeDemoAttachment } from "./photos";
import MediaPreview from "./MediaPreview";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, localKey } from "./api";
import { Observation } from "./domain";
import { Button, styles } from "./ui";
export async function photoForReport(reportId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("observation_media")
    .select("id,status")
    .eq("observation_id", reportId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const response = await supabase.functions.invoke("observation-photo", {
    body: { action: "url", mediaId: data.id },
  });
  if (response.error || response.data?.error || !response.data?.url)
    throw Error("Attachment unavailable. Try again shortly.");
  return {
    id: data.id,
    status: data.status,
    url: response.data.url as string,
    canRemove: response.data.canRemove === true,
    kind:
      response.data.kind === "video" ? ("video" as const) : ("photo" as const),
  };
}
export default function ObservationPhoto({ report }: { report: Observation }) {
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["report-photo", report.id],
    queryFn: () => photoForReport(report.id),
    enabled: !!supabase && !report.demo,
    staleTime: 45000,
    refetchInterval: 50000,
    retry: 1,
  });
  const uri = removed
    ? undefined
    : report.demo &&
        (/^data:(image\/jpeg|video\/(mp4|quicktime));base64,/.test(
          report.photo_uri ?? "",
        ) ||
          (report.media_kind === "video" &&
            report.photo_uri?.startsWith("file://")))
      ? report.photo_uri
      : q.data?.url;
  return (
    <View style={{ gap: 8 }}>
      {!!uri && (
        <MediaPreview
          uri={uri}
          kind={report.demo ? report.media_kind : q.data?.kind}
          label="Observation attachment"
        />
      )}
      {report.demo && !!uri && (
        <Button
          label="Remove demo attachment"
          onPress={() => {
            void AsyncStorage.getItem(localKey)
              .then((raw) => {
                const reports: Observation[] = JSON.parse(raw || "[]");
                return AsyncStorage.setItem(
                  localKey,
                  JSON.stringify(
                    reports.map((item) => {
                      if (item.id !== report.id) return item;
                      const copy = { ...item };
                      if (copy.photo_uri) removeDemoAttachment(copy.photo_uri);
                      delete copy.photo_uri;
                      delete copy.media_bytes;
                      delete copy.media_kind;
                      return copy;
                    }),
                  ),
                );
              })
              .then(() => {
                setRemoved(true);
                void client.invalidateQueries({ queryKey: ["observations"] });
              })
              .catch(() => setMessage("Unable to remove the saved photo."));
          }}
        />
      )}
      {q.data?.status === "pending" && (
        <Text style={styles.text}>
          Your attachment is private until a moderator reviews it.
        </Text>
      )}
      {q.data?.canRemove && (
        <Button
          label="Remove my attachment"
          onPress={() => {
            const media = q.data;
            if (!media || !supabase) return;
            void supabase.functions
              .invoke("observation-photo", {
                body: { action: "remove", mediaId: media.id },
              })
              .then(({ data, error }) => {
                if (error || data?.error)
                  throw Error("Unable to remove attachment.");
                void client.invalidateQueries({
                  queryKey: ["report-photo", report.id],
                });
              })
              .catch((error) => setMessage(String(error)));
          }}
        />
      )}
      {q.error && (
        <Button
          label="Attachment unavailable · Retry"
          onPress={() => {
            void q.refetch();
          }}
        />
      )}
      {message.length > 0 && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}
