import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./ui";
import type { ReactNode } from "react";
export default function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          minHeight: 44,
          paddingVertical: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={[
            styles.text,
            { color: "#9ce5d9", fontWeight: "600", flexShrink: 1 },
          ]}
        >
          {label}
        </Text>
        <Text style={styles.text}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open && children}
    </View>
  );
}
