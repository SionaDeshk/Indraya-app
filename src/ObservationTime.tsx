import { useState } from "react";
import { Platform, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, styles } from "./ui";
export default function ObservationTime({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (time: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const [mode, setMode] = useState<"date" | "time">("date");
  function choose(earlier: boolean) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setDraft(
      earlier
        ? new Date(Math.max(start.getTime(), now.getTime() - 3600000))
        : value
          ? new Date(value)
          : now,
    );
    setEditing(true);
    setMode("date");
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={[styles.heading, { fontSize: 22 }]}>
        When did you see it?
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          label={value === null ? "● Now" : "Now"}
          onPress={() => {
            onChange(null);
            setEditing(false);
          }}
        />
        <Button label="Earlier today" onPress={() => choose(true)} />
        <Button label="Choose time" onPress={() => choose(false)} />
      </View>
      <Text style={styles.text}>
        {value
          ? new Date(value).toLocaleString()
          : "Now · recorded when you submit"}
      </Text>
      {editing && (
        <View style={styles.card}>
          <DateTimePicker
            value={draft}
            mode={Platform.OS === "ios" ? "datetime" : mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            minimumDate={new Date(Date.now() - 30 * 86400000)}
            onChange={(event, date) => {
              if (event.type === "dismissed") {
                setEditing(false);
                return;
              }
              if (date) {
                setDraft(date);
                if (Platform.OS !== "ios") {
                  if (mode === "date") setMode("time");
                  else {
                    onChange(date.toISOString());
                    setEditing(false);
                  }
                }
              }
            }}
          />
          {Platform.OS !== "ios" && (
            <Button
              label={mode === "date" ? "Set time" : "Set date"}
              onPress={() => setMode(mode === "date" ? "time" : "date")}
            />
          )}
          <Button
            label="Use observation time"
            onPress={() => {
              onChange(draft.toISOString());
              setEditing(false);
            }}
          />
          <Button
            label="Cancel time selection"
            onPress={() => setEditing(false)}
          />
        </View>
      )}
    </View>
  );
}
