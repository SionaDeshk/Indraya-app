import { useState } from "react";
import { Text, View } from "react-native";
import { Button, styles } from "./ui";
function localInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export default function ObservationTime({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (time: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(localInput(new Date()));
  const [message, setMessage] = useState("");
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
        <Button
          label="Earlier today"
          onPress={() => {
            const now = new Date(),
              start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
              );
            setDraft(
              localInput(
                new Date(Math.max(start.getTime(), now.getTime() - 3600000)),
              ),
            );
            setEditing(true);
          }}
        />
        <Button
          label="Choose time"
          onPress={() => {
            setDraft(localInput(value ? new Date(value) : new Date()));
            setEditing(true);
          }}
        />
      </View>
      <Text style={styles.text}>
        {value
          ? new Date(value).toLocaleString()
          : "Now · recorded when you submit"}
      </Text>
      {editing && (
        <View style={styles.card}>
          <label style={{ color: "#b3c8c8" }}>
            Observation date and time
            <input
              aria-label="Observation date and time"
              type="datetime-local"
              value={draft}
              max={localInput(new Date())}
              min={localInput(new Date(Date.now() - 30 * 86400000))}
              onChange={(event) => setDraft(event.target.value)}
              style={{
                width: "100%",
                padding: 12,
                background: "#132b30",
                color: "white",
                border: "1px solid #345056",
                borderRadius: 10,
              }}
            />
          </label>
          <Button
            label="Use observation time"
            onPress={() => {
              const date = new Date(draft);
              if (!Number.isFinite(date.getTime())) {
                setMessage("Choose a valid date and time.");
                return;
              }
              onChange(date.toISOString());
              setEditing(false);
              setMessage("");
            }}
          />
          <Button
            label="Cancel time selection"
            onPress={() => setEditing(false)}
          />
          {message.length > 0 && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
