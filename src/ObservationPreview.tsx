import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Observation, age, observedTime, reportAppearance } from "./domain";
import { effectiveAssessment, riskPresentation } from "./assessment";
import { useNow } from "./Clock";
import { markerFamily } from "./markerFamily";
import { mapSymbols } from "./mapSymbols";
import { styles } from "./ui";
export default function ObservationPreview({
  report,
  onClose,
  onExpand,
  bottom,
  maxHeight,
}: {
  report: Observation;
  onClose: () => void;
  onExpand: () => void;
  bottom: number;
  maxHeight: number;
}) {
  const appearance = reportAppearance(report),
    assessment = effectiveAssessment(report, useNow());
  const risk =
    assessment.state === "active"
      ? riskPresentation[assessment.level].label
      : assessment.state === "not_assessed"
        ? "Staff risk: not assessed"
        : `Staff assessment ${assessment.state}`;
  return (
    <View
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom,
        maxHeight,
        backgroundColor: "#10282c",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#345056",
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              backgroundColor: appearance.color,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={mapSymbols[markerFamily(report)].image}
              style={{ width: 22, height: 22 }}
              accessible={false}
            />
          </View>
          <Text
            numberOfLines={1}
            style={{
              color: appearance.color,
              flex: 1,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {appearance.label}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close observation preview"
            onPress={onClose}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, color: "#c9e6df" }}>×</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={{ flexShrink: 1, minHeight: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
          gap: 8,
        }}
      >
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={{ fontSize: 20, fontWeight: "700", color: "#edf6f3" }}
        >
          {report.title}
        </Text>
        <Text numberOfLines={1} style={styles.text}>
          {report.place_name || "Approximate map location"}
        </Text>
        <Text style={{ color: "#afc9c8", fontSize: 12 }}>
          Observed {age(observedTime(report))} ·{" "}
          {report.demo ? "DEMO" : report.source} · {report.verification}
        </Text>
        <Text
          style={{
            color:
              assessment.state === "active"
                ? riskPresentation[assessment.level].color
                : "#afc9c8",
            fontSize: 12,
          }}
        >
          {risk}
        </Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View full observation"
          onPress={onExpand}
          style={{
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 22,
            backgroundColor: "#204347",
          }}
        >
          <Text style={{ color: "#9ce5d9", fontWeight: "700" }}>
            View full report
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
