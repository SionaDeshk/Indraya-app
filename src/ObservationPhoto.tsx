import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Text, View } from "react-native";
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
    throw Error("Photo unavailable. Try again shortly.");
  return {
    id: data.id,
    status: data.status,
    url: response.data.url as string,
    canRemove: response.data.canRemove === true,
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
    : report.demo && report.photo_uri?.startsWith("data:image/jpeg;base64,")
      ? report.photo_uri
      : q.data?.url;
  return (
    <View style={{ gap: 8 }}>
      {!!uri && (
        <Image
          accessibilityLabel="Observation photo"
          source={{ uri }}
          style={{ width: "100%", height: 220, borderRadius: 16 }}
          resizeMode="contain"
          onError={() => setMessage("Unable to display the photo.")}
        />
      )}
      {report.demo && !!uri && (
        <Button
          label="Remove demo photo"
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
                      delete copy.photo_uri;
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
          Your photo is private until a moderator reviews it.
        </Text>
      )}
      {q.data?.canRemove && (
        <Button
          label="Remove my photo"
          onPress={() => {
            const media = q.data;
            if (!media || !supabase) return;
            void supabase.functions
              .invoke("observation-photo", {
                body: { action: "remove", mediaId: media.id },
              })
              .then(({ data, error }) => {
                if (error || data?.error)
                  throw Error("Unable to remove photo.");
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
          label="Photo unavailable · Retry"
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
