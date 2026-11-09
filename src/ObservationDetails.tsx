import { Text, View } from "react-native";
import { age, observedTime, Observation, reportAppearance } from "./domain";
import ObservationResponses from "./ObservationResponses";
import RegionalSources from "./RegionalSources";
import { observationStatus, expiresAt } from "./observationLifecycle";
import { useNow } from "./Clock";
import ObservationPhoto from "./ObservationPhoto";
import ReportAnswers from "./ReportAnswers";
import AssessmentBadge from "./AssessmentBadge";
import { styles } from "./ui";
export default function ObservationDetails({
  report,
}: {
  report: Observation;
}) {
  const now = useNow();
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
      <Text style={styles.text}>
        {observationStatus(report, now).label} ·{" "}
        {observationStatus(report, now).explanation}
      </Text>
      {!!report.description && (
        <Text style={styles.text}>{report.description}</Text>
      )}
      {report.status !== "review" && report.status !== "hidden" && (
        <Text style={styles.text}>
          Active-map expiry: {new Date(expiresAt(report)).toLocaleString()}.
          History is retained; expiry does not mean resolved.
        </Text>
      )}
      {report.extent && (
        <Text style={styles.text}>
          {report.extent.context === "traffic_backup"
            ? "Approximate observed traffic backup. The point marks the collision; the stretch is not an official closure."
            : "Approximate observed extent, not a forecast or hazard boundary. Unmarked nearby terrain is not an all-clear."}
        </Text>
      )}
      <ReportAnswers report={report} />
      <AssessmentBadge report={report} showUnassessed />
      <ObservationPhoto report={report} />
      <ObservationResponses report={report} />
      <RegionalSources
        key={report.id}
        place={report.place_name ?? ""}
        type={report.event_type_id}
      />
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
