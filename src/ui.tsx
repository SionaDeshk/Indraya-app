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
      <Text style={{ color: "#9ce5d9", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#071719",
    padding: 24,
    paddingTop: 64,
    gap: 16,
  },
  heading: { color: "#edf6f3", fontSize: 30, fontWeight: "700" },
  text: { color: "#b3c8c8", fontSize: 15, lineHeight: 23 },
  input: {
    color: "#fff",
    backgroundColor: "#132b30",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#345056",
  },
  button: {
    backgroundColor: "#19383b",
    padding: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  card: { backgroundColor: "#10282c", padding: 22, borderRadius: 24, gap: 12 },
});
