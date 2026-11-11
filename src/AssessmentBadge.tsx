import { Text, View } from "react-native";
import {
  effectiveAssessment,
  riskPresentation,
  PublicAssessment,
} from "./assessment";
import { useNow } from "./Clock";
import { styles } from "./ui";
export default function AssessmentBadge({
  report,
  showUnassessed = false,
}: {
  report: PublicAssessment;
  showUnassessed?: boolean;
}) {
  const current = effectiveAssessment(report, useNow());
  if (current.state === "not_assessed" && !showUnassessed) return null;
  const label =
    current.state === "active"
      ? riskPresentation[current.level].label
      : current.state === "expired"
        ? "Staff assessment expired"
        : current.state === "resolved"
          ? "Staff assessment resolved"
          : current.state === "disputed"
            ? "Staff assessment disputed"
            : "Staff risk: not assessed";
  const color =
    current.state === "active"
      ? riskPresentation[current.level].color
      : "#b3c8c8";
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      {current.state === "active" && report.assessment_expires_at && (
        <Text style={[styles.text, { fontSize: 12 }]}>
          Review due {new Date(report.assessment_expires_at).toLocaleString()}
        </Text>
      )}
      {showUnassessed && current.state === "not_assessed" && (
        <Text style={[styles.text, { fontSize: 12 }]}>
          Not assessed does not mean safe.
        </Text>
      )}
    </View>
  );
}
