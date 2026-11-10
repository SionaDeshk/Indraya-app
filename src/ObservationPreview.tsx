import { Pressable, ScrollView, Text, View } from "react-native";
import { Observation, age, observedTime, reportAppearance } from "./domain";
import AssessmentBadge from "./AssessmentBadge";
import { effectiveAssessment } from "./assessment";
import { useNow } from "./Clock";
import ObservationIcon from "./ObservationIcon";
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
          <ObservationIcon report={report} />
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
        {assessment.state === "active" && <AssessmentBadge report={report} />}
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
            View observation
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
