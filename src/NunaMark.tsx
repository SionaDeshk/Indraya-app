import { View } from "react-native";

/** NUNA mark: concentric white ring, teal core and four orbit points. */
export default function NunaMark({ size = 36 }: { size?: number }) {
  const unit = size / 100;
  const dot = 7 * unit;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 55 * unit, height: 55 * unit, borderRadius: 30 * unit, borderWidth: 5.5 * unit, borderColor: "#f7f7f5", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 32 * unit, height: 32 * unit, borderRadius: 16 * unit, backgroundColor: "#009a9f" }} />
      </View>
      <View style={{ position: "absolute", top: 10 * unit, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#f7f7f5" }} />
      <View style={{ position: "absolute", bottom: 10 * unit, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#e52535" }} />
      <View style={{ position: "absolute", left: 10 * unit, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#f7f7f5" }} />
      <View style={{ position: "absolute", right: 10 * unit, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: "#f7f7f5" }} />
    </View>
  );
}
