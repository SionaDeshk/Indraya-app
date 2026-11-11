import { Text, View } from "react-native";
import { age, observedTime, Observation, reportAppearance } from "./domain";
import ObservationPhoto from "./ObservationPhoto";
import ReportAnswers from "./ReportAnswers";
import AssessmentBadge from "./AssessmentBadge";
import { styles } from "./ui";
export default function ObservationDetails({
  report,
}: {
  report: Observation;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{ color: reportAppearance(report).color, fontWeight: "700" }}
      >
        {reportAppearance(report).label} · {report.verification.toUpperCase()}
      </Text>
      <Text accessibilityRole="header" style={styles.heading}>
        {report.title}
      </Text>
      <Text style={styles.text}>
        {report.place_name || "Approximate map location"} · Observed{" "}
        {age(observedTime(report))}
      </Text>
      {report.status === "review" && (
        <Text style={{ color: "#e6c68b" }}>
          Private review · not on the public map
        </Text>
      )}
      {report.privacy_class === "restricted" && (
        <Text style={styles.text}>
          Regional information only. No incident pin or exact location is
          published.
        </Text>
      )}
      <Text style={styles.text}>{report.description}</Text>
      <ReportAnswers report={report} />
      <AssessmentBadge report={report} showUnassessed />
      <ObservationPhoto report={report} />
      <Text style={styles.text}>
        {report.source} · Submitted {age(report.created_at)}
      </Text>
      <Text style={[styles.text, { fontSize: 12 }]}>
        Community observations are not emergency-service confirmations. In an
        emergency, contact emergency services.
      </Text>
    </View>
  );
}
