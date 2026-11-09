import { useState } from "react";
import { Modal, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReportLocation } from "./domain";
import { PrivacyClass } from "./taxonomy";
import {
  ObservationExtent,
  extentModes,
  normalizeExtent,
} from "./observationExtent";
import LocationMap from "./LocationMap";
import { Button, styles } from "./ui";
export default function ExtentPicker({
  value,
  onChange,
  type,
  privacy,
  location,
}: {
  value: ObservationExtent | null;
  onChange: (value: ObservationExtent | null) => void;
  type: string;
  privacy: PrivacyClass;
  location: ReportLocation | null;
}) {
  const [mode, setMode] = useState<"line" | "area" | null>(null),
    [points, setPoints] = useState<number[][]>([]),
    [message, setMessage] = useState("");
  const modes = extentModes(type, privacy);
  if (modes.length < 2 || !location) return null;
  const shape: ObservationExtent | null =
    mode && points.length >= (mode === "line" ? 2 : 3)
      ? {
          type: mode === "line" ? "LineString" : "Polygon",
          coordinates: mode === "line" ? points : [[...points, points[0]]],
        }
      : null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.text}>Affected extent · Optional</Text>
      <Text style={styles.text}>
        {type === "collision"
          ? "Mark the collision as one spot, or draw an observed traffic backup. This is not an official closure boundary."
          : "Mark only the approximate stretch or area you observed. Nearby unmarked terrain is not an all-clear."}
      </Text>
      <Button
        label={value ? "Use one spot instead" : "✓ One spot"}
        onPress={() => onChange(null)}
      />
      {Platform.OS !== "web" ? (
        modes
          .filter((m) => m !== "point")
          .map((m) => (
            <Button
              key={m}
              label={
                m === "line"
                  ? "Draw observed stretch"
                  : "Draw approximate observed area"
              }
              onPress={() => {
                setMode(m as "line" | "area");
                setPoints([]);
                setMessage("");
              }}
            />
          ))
      ) : (
        <Text style={styles.text}>
          Drawing is available on the native map. This browser observation uses
          one spot.
        </Text>
      )}
      {!!value && (
        <Text style={styles.text}>
          Approximate {value.type === "LineString" ? "stretch" : "area"}{" "}
          selected.
        </Text>
      )}
      <Modal
        visible={!!mode}
        animationType="slide"
        onRequestClose={() => setMode(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
          <Text style={[styles.heading, { padding: 20, fontSize: 22 }]}>
            Tap points along what you observed
          </Text>
          <View style={{ flex: 1 }}>
            <LocationMap
              location={location}
              extent={shape}
              onPick={(p) => {
                if (points.length < 16)
                  setPoints([...points, [p.longitude, p.latitude]]);
              }}
            />
          </View>
          <View style={{ padding: 20, gap: 10 }}>
            <Text style={styles.text}>
              {points.length} points · Approximate, not an official boundary
            </Text>
            {!!message && (
              <Text accessibilityRole="alert" style={styles.text}>
                {message}
              </Text>
            )}
            <Button
              label="Undo point"
              disabled={!points.length}
              onPress={() => setPoints(points.slice(0, -1))}
            />
            <Button
              label="Use observed extent"
              disabled={!shape}
              onPress={() => {
                try {
                  onChange(
                    normalizeExtent(
                      shape,
                      type,
                      privacy,
                      location.latitude,
                      location.longitude,
                    ),
                  );
                  setMode(null);
                } catch (e) {
                  setMessage(String(e));
                }
              }}
            />
            <Button label="Cancel drawing" onPress={() => setMode(null)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
