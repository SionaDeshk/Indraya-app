import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, styles } from "./ui";
export type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
};
export default function ChoiceSheet({
  label,
  value,
  options,
  onChange,
  placeholder = "Choose…",
  disabled = false,
}: {
  label: string;
  value?: string | null;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const current = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        !q || `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [options, query]);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.text}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        disabled={disabled}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={[
          styles.input,
          {
            minHeight: 50,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          },
        ]}
      >
        <Text style={{ color: current ? "#e6f4ef" : "#aac1c1", flex: 1 }}>
          {current?.label ?? placeholder}
        </Text>
        <Text style={{ color: "#9ce5d9" }}>⌄</Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
          <View style={{ padding: 24, gap: 16 }}>
            <Text
              accessibilityRole="header"
              style={[styles.heading, { fontSize: 24 }]}
            >
              {label}
            </Text>
            {options.length > 5 && (
              <TextInput
                accessibilityLabel={`Find ${label.toLowerCase()}`}
                placeholder="Find an option"
                placeholderTextColor="#9ab3b7"
                style={styles.input}
                value={query}
                onChangeText={setQuery}
              />
            )}
            <Button
              label={`Cancel ${label.toLowerCase()}`}
              onPress={() => setOpen(false)}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 10 }}
          >
            {filtered.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.value === value }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[
                  styles.card,
                  {
                    borderWidth: 1,
                    borderColor: option.value === value ? "#9ce5d9" : "#29464a",
                    padding: 16,
                  },
                ]}
              >
                <Text
                  style={{ fontSize: 17, fontWeight: "600", color: "#edf6f3" }}
                >
                  {option.label}
                  {option.value === value ? " ✓" : ""}
                </Text>
                {option.description && (
                  <Text style={styles.text}>{option.description}</Text>
                )}
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <Text style={styles.text}>
                No matching options. Try another word.
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
