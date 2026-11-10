import { useState } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { nearbyStation } from "./weatherStations";
import { Button, styles } from "./ui";
import { useNow } from "./Clock";
export default function WeatherStation({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}) {
  const [open, setOpen] = useState(false);
  const now = useNow();
  const x = Math.round(longitude * 100) / 100,
    y = Math.round(latitude * 100) / 100;
  const query = useQuery({
    queryKey: ["nws-station", x, y],
    queryFn: ({ signal }) => nearbyStation(x, y, signal),
    enabled: open,
    staleTime: 300000,
    refetchInterval: open ? 300000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const data = query.data;
  const stale = data && now - Date.parse(data.observedAt) > 3600000;
  return (
    <View style={{ gap: 10 }}>
      <Button
        label={
          open ? "Hide nearby weather station" : "Nearby weather station · NWS"
        }
        onPress={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <Text style={[styles.text, { fontSize: 12 }]}>
            Uses this observation's approximate map area, not device GPS.
            Refreshes every 5 minutes while open.
          </Text>
          {query.isLoading && (
            <Text style={styles.text}>Looking for a nearby NWS station…</Text>
          )}
          {data && (
            <>
              <Text style={styles.text}>
                {data.name} · {data.distance} km away
                {data.elevation !== null
                  ? ` · ${data.elevation} m elevation`
                  : ""}
              </Text>
              <Text style={styles.text}>
                Wind {data.wind === null ? "unavailable" : `${data.wind} mph`}
                {data.gust !== null ? ` · gust ${data.gust} mph` : ""} ·{" "}
                {data.temperature === null
                  ? "Temperature unavailable"
                  : `${data.temperature}°F`}
              </Text>
              <Text
                style={[
                  styles.text,
                  { color: stale ? "#e6c68b" : "#afc9c8", fontSize: 12 },
                ]}
              >
                {stale ? "Older reading · " : "Observed "}
                {new Date(data.observedAt).toLocaleString()}
                {query.isError ? " · Refresh failed" : ""}
              </Text>
            </>
          )}
          {query.error && (
            <>
              <Text accessibilityRole="alert" style={styles.text}>
                {query.error.message}
              </Text>
              <Button
                label="Retry weather station"
                disabled={query.isFetching}
                onPress={() => {
                  void query.refetch();
                }}
              />
            </>
          )}
          <Text style={[styles.text, { fontSize: 12 }]}>
            NOAA/NWS · A nearby station does not represent a summit, lake
            surface or slope. Missing readings are not zero; this is not a
            danger rating.
          </Text>
        </>
      )}
    </View>
  );
}
