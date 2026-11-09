import { Pressable, Text, View } from "react-native";
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
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.text}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => (
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
    </View>
  );
}
