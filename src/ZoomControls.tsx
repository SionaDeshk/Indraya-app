import { Pressable, Text, View } from "react-native";
export default function ZoomControls({
  onZoom,
  zoom,
}: {
  onZoom: (delta: number) => void;
  zoom: number;
}) {
  return (
    <View style={{ position: "absolute", right: 16, top: "43%", gap: 8 }}>
      {[
        { label: "Zoom in", symbol: "+", delta: 1 },
        { label: "Zoom out", symbol: "−", delta: -1 },
      ].map((button) => (
        <Pressable
          key={button.label}
          accessibilityRole="button"
          accessibilityLabel={button.label}
          disabled={button.delta > 0 ? zoom >= 17 : zoom <= 1}
          onPress={() => onZoom(button.delta)}
          style={{
            width: 46,
            height: 46,
            backgroundColor: "#10282c",
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#79b8b0",
          }}
        >
          <Text style={{ color: "#e6f5f0", fontSize: 28 }}>
            {button.symbol}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
