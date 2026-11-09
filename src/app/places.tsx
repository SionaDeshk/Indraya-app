import { ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import useActorBoundary from "../useActorBoundary";
import { followedPlaces, unfollowPlace } from "../places";
import { Button, styles } from "../ui";
export default function Places() {
  const boundary = useActorBoundary();
  const q = useQuery({
      queryKey: ["private", "places", boundary.actor],
      enabled: boundary.actor !== undefined && !boundary.invalidated,
      queryFn: followedPlaces,
    }),
    client = useQueryClient(),
    [message, setMessage] = useState("");
  if (boundary.invalidated)
    return (
      <View style={styles.page}>
        <Text accessibilityRole="alert" style={styles.text}>
          Account changed. Reopen Following places.
        </Text>
        <Button label="Back to map" onPress={() => router.replace("/")} />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Button label="Back to map" onPress={() => router.replace("/")} />
      <Text accessibilityRole="header" style={styles.heading}>
        Following places
      </Text>
      <Text style={styles.text}>
        Private place shortcuts. Following does not enable notifications,
        emergency monitoring or background tracking.
      </Text>
      {q.error && (
        <Text accessibilityRole="alert" style={styles.text}>
          Sign in or reconnect to view your places.
        </Text>
      )}
      {q.data?.length === 0 && (
        <Text style={styles.text}>
          Search for a place on the map, then choose Follow this place.
        </Text>
      )}
      {q.data?.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.heading}>{p.name}</Text>
          <Button
            label={`Open ${p.name}`}
            onPress={() =>
              router.replace({
                pathname: "/",
                params: {
                  latitude: String(p.latitude),
                  longitude: String(p.longitude),
                  place: p.name,
                },
              })
            }
          />
          <Button
            label={`Unfollow ${p.name}`}
            onPress={() => {
              void unfollowPlace(p.id)
                .then(() =>
                  client.invalidateQueries({ queryKey: ["private", "places"] }),
                )
                .catch(() => setMessage("Unable to remove this place."));
            }}
          />
        </View>
      ))}
      {!!message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </ScrollView>
  );
}
