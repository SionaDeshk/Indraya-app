import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  onOpenMap: () => void;
  onReport: () => void;
  onLayers: () => void;
};

const topics = [
  { symbol: "!", title: "Incidents", detail: "Wildfire · Closures", tint: "#ff7889" },
  { symbol: "△", title: "Avalanche", detail: "Forecasts · Reports", tint: "#9bdce7" },
  { symbol: "≋", title: "Weather", detail: "Wind · Snow", tint: "#8dd9d2" },
  { symbol: "≈", title: "Marine", detail: "Tides · Conditions", tint: "#83baff" },
  { symbol: "◉", title: "Fishing", detail: "Runs · Observations", tint: "#89e0b3" },
];

export default function NunaWelcome({ onOpenMap, onReport, onLayers }: Props) {
  return (
    <View style={s.overlay}>
      <View pointerEvents="none" style={s.glowPurple} />
      <View pointerEvents="none" style={s.glowTeal} />
      <Text pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.watermark}>NUNA</Text>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.brandRow}>
          <Text style={s.brand}>N U N A</Text>
          <Text style={s.eyebrow}>ALASKA · LIVE</Text>
        </View>
        <View style={s.hero}>
          <Text style={s.title}>Alaska in{"\n"}Real Time</Text>
          <Text style={s.kicker}>INCIDENTS  ·  CONDITIONS  ·  OUTDOORS</Text>
          <Text style={s.description}>A community-powered view of Alaska's changing landscape. Explore reports, conditions, and observations on the live map.</Text>
          <Pressable accessibilityRole="button" onPress={onOpenMap} style={s.primary}><Text style={s.primaryText}>⌖  Open Map  →</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onReport} style={s.secondary}><Text style={s.secondaryText}>＋  Share an observation</Text></Pressable>
        </View>
        <Text style={s.sectionTitle}>EXPLORE ALASKA</Text>
        <View style={s.topicWrap}>
          {topics.map((topic) => (
            <Pressable key={topic.title} accessibilityRole="button" onPress={onLayers} style={s.topic}>
              <Text style={[s.topicSymbol, { color: topic.tint }]}>{topic.symbol}</Text>
              <View><Text style={s.topicTitle}>{topic.title}</Text><Text style={s.topicDetail}>{topic.detail}</Text></View>
            </Pressable>
          ))}
        </View>
        <Text style={s.disclaimer}>Community observations are not emergency dispatch. Always confirm hazards with official sources.</Text>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "#050c15", overflow: "hidden" },
  glowPurple: { position: "absolute", top: 95, right: -100, width: 340, height: 390, borderRadius: 200, backgroundColor: "#37205b", opacity: 0.58 },
  glowTeal: { position: "absolute", top: 260, left: -140, width: 350, height: 380, borderRadius: 200, backgroundColor: "#064d53", opacity: 0.45 },
  watermark: { position: "absolute", top: 120, left: -14, fontSize: 112, fontWeight: "900", letterSpacing: 9, color: "rgba(174,210,222,0.065)" },
  content: { flexGrow: 1, paddingTop: 66, paddingHorizontal: 24, paddingBottom: 55 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 22, color: "#f2f5fc", letterSpacing: 4, fontWeight: "600" },
  eyebrow: { fontSize: 10, color: "#9fc6d2", letterSpacing: 2 },
  hero: { paddingTop: 120, paddingBottom: 35 },
  title: { color: "#f2f2fc", fontSize: 52, lineHeight: 59, fontWeight: "300", letterSpacing: 1 },
  kicker: { color: "#b7bbd5", fontSize: 10, letterSpacing: 2, marginTop: 18 },
  description: { color: "#c5d4dc", fontSize: 16, lineHeight: 25, marginTop: 20, marginBottom: 28, maxWidth: 340 },
  primary: { backgroundColor: "#6644b0", borderRadius: 30, paddingVertical: 17, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#9b7de3" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondary: { borderColor: "#a1a3c0", borderWidth: 1, borderRadius: 30, paddingVertical: 16, alignItems: "center", backgroundColor: "rgba(9,15,30,0.65)" },
  secondaryText: { color: "#e9e9f6", fontWeight: "600", fontSize: 15 },
  sectionTitle: { color: "#a7b5cb", letterSpacing: 3, fontSize: 11, marginBottom: 14 },
  topicWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topic: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "rgba(15,30,44,0.93)", borderColor: "#34465a", borderWidth: 1, borderRadius: 14, padding: 13, minWidth: "46%", flexGrow: 1 },
  topicSymbol: { fontSize: 25, fontWeight: "600", width: 27, textAlign: "center" },
  topicTitle: { color: "#f0f4f8", fontSize: 14, fontWeight: "700" },
  topicDetail: { color: "#a3b6c5", fontSize: 10, marginTop: 4 },
  disclaimer: { color: "#8ca3b2", fontSize: 11, lineHeight: 17, marginTop: 25 },
});
