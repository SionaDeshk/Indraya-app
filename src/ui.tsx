import { Pressable, Text, StyleSheet } from "react-native";
export function Button({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && { opacity: 0.4 }]}
    >
      <Text style={{ color: "#d9d4ff", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#080d1a",
    padding: 24,
    paddingTop: 64,
    gap: 16,
  },
  heading: { color: "#f2f2fc", fontSize: 30, fontWeight: "700" },
  text: { color: "#b9c6d8", fontSize: 15, lineHeight: 23 },
  input: {
    color: "#fff",
    backgroundColor: "#141d31",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#485074",
  },
  button: {
    backgroundColor: "#222344",
    padding: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  card: { backgroundColor: "#111b2d", padding: 22, borderRadius: 24, gap: 12 },
});
