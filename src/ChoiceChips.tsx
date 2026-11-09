import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { styles } from "./ui";
export default function ChoiceChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState(false);
  const matches = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const displayed =
    options.length > 9 && !expanded && !query
      ? matches.filter(
          (o, i) =>
            i < 6 ||
            o.value === value ||
            o.value === "unknown" ||
            o.value === "other",
        )
      : matches;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.text}>{label}</Text>
      {options.length > 9 && (
        <TextInput
          accessibilityLabel={`Find ${label.toLowerCase()}`}
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholder="Search choices"
          placeholderTextColor="#9ab3b7"
        />
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {displayed.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ checked: option.value === value }}
            aria-checked={option.value === value}
            onPress={() => onChange(option.value)}
            style={{
              minHeight: 44,
              maxWidth: "100%",
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: option.value === value ? "#9ce5d9" : "#345056",
              backgroundColor: option.value === value ? "#204347" : "#10282c",
            }}
          >
            <Text style={{ color: "#edf6f3", flexShrink: 1 }}>
              {option.value === value ? "✓ " : ""}
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {options.length > 9 && !query && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded(!expanded)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: "#9ce5d9" }}>
            {expanded ? "Show fewer choices" : "More choices"}
          </Text>
        </Pressable>
      )}
      {!matches.length && (
        <Text style={styles.text}>No matching choices. Try another word.</Text>
      )}
    </View>
  );
}
