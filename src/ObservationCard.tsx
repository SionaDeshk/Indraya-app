import { Pressable, Text, View } from "react-native";
import { age, Observation, observedTime, reportAppearance } from "./domain";
import ObservationIcon from "./ObservationIcon";
import AssessmentBadge from "./AssessmentBadge";
import { styles } from "./ui";
export default function ObservationCard({
  report,
  onPress,
  distance,
}: {
  report: Observation;
  onPress: () => void;
  distance?: number;
}) {
  const appearance = reportAppearance(report);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={report.title}
      accessibilityHint={`${report.place_name || "Approximate map location"}. ${appearance.label}. ${age(observedTime(report))}. ${report.verification}. Tap to center the map and open details.`}
      onPress={onPress}
      style={{
        backgroundColor: "#19383b",
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: appearance.color,
        padding: 12,
        gap: 4,
        minWidth: 210,
        maxWidth: 280,
        marginRight: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <ObservationIcon report={report} size={25} />
        <Text
          numberOfLines={1}
          style={{ color: appearance.color, fontWeight: "700", fontSize: 13 }}
        >
          {appearance.label}
        </Text>
      </View>
      <Text style={{ color: "#eef7f1", fontSize: 15, fontWeight: "700" }}>
        {report.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.text, { fontSize: 12, lineHeight: 17 }]}
      >
        {report.place_name || "Approximate map location"}
        {distance !== undefined
          ? ` · ${distance < 1 ? "<1" : distance.toFixed(0)} km from map center`
          : ""}
      </Text>
      <AssessmentBadge report={report} />
      <Text
        numberOfLines={1}
        style={[styles.text, { fontSize: 11, lineHeight: 16 }]}
      >
        Seen {age(observedTime(report))} ·{" "}
        {report.demo ? "DEMO" : report.source} · {report.verification}
      </Text>
    </Pressable>
  );
}
