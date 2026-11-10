import { Text, View } from "react-native";
import { age, observedTime, Observation } from "./domain";
import ObservationResponses from "./ObservationResponses";
import RegionalSources from "./RegionalSources";
import { observationStatus, expiresAt } from "./observationLifecycle";
import { useNow } from "./Clock";
import ObservationPhoto from "./ObservationPhoto";
import ObservationIcon from "./ObservationIcon";
import ReportAnswers from "./ReportAnswers";
import AssessmentBadge from "./AssessmentBadge";
import Disclosure from "./Disclosure";
import { summaryFacts } from "./observationSummary";
import { styles } from "./ui";
export default function ObservationDetails({
  report,
}: {
  report: Observation;
}) {
  const status = observationStatus(report, useNow());
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <ObservationIcon report={report} size={36} />
        <Text
          accessibilityRole="header"
          style={[styles.heading, { fontSize: 23, flex: 1 }]}
        >
          {report.title}
        </Text>
      </View>
      <Text style={styles.text}>
        {report.place_name || "Approximate map location"} · Seen{" "}
        {age(observedTime(report))}
      </Text>
      <Text style={[styles.text, { fontSize: 12 }]}>
        {report.demo ? "Demo observation" : "Community observation"} ·{" "}
        {report.verification === "reviewed" ? "Reviewed" : "Unverified"}
      </Text>
      {status.label !== "Shared" && (
        <Text accessibilityRole="alert" style={{ color: "#e6c68b" }}>
          {status.label} · {status.explanation}
        </Text>
      )}
      {report.privacy_class === "restricted" && (
        <Text style={styles.text}>Regional location only.</Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {summaryFacts(report).map((fact) => (
          <View
            key={fact}
            style={{
              backgroundColor: "#19383b",
              borderRadius: 12,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <Text style={[styles.text, { fontSize: 13 }]}>{fact}</Text>
          </View>
        ))}
      </View>
      {!!report.description &&
        (report.description.length <= 220 ? (
          <Text style={styles.text}>{report.description}</Text>
        ) : (
          <Disclosure label="Read the note">
            <Text style={styles.text}>{report.description}</Text>
          </Disclosure>
        ))}
      <AssessmentBadge report={report} />
      <ObservationPhoto report={report} />
      <ObservationResponses report={report} />
      <RegionalSources
        key={report.id}
        place={report.place_name ?? ""}
        type={report.event_type_id}
        coordinate={
          !report.demo &&
          report.privacy_class === "approximate" &&
          /weather|snow|wind|rain|visibility|avalanche|ice|ski/.test(
            report.event_type_id ?? "",
          )
            ? [report.longitude, report.latitude]
            : undefined
        }
      />
      <Disclosure label="More observation details">
        <ReportAnswers report={report} />
        <Text style={styles.text}>
          Unreviewed community information is not a forecast or an
          emergency-service confirmation.
        </Text>
        {report.extent && (
          <Text style={styles.text}>
            {report.extent.context === "traffic_backup"
              ? "The point marks the collision; the dashed stretch describes the observed backup."
              : "Dashed extent: the observer's approximate description, not an official boundary."}
          </Text>
        )}
        <Text style={styles.text}>
          Leaves the active map {new Date(expiresAt(report)).toLocaleString()}.
          History remains; expiry does not mean resolved.
        </Text>
        <Text style={styles.text}>
          {report.source} · Submitted {age(report.created_at)}
        </Text>
        {report.demo && (
          <Text style={styles.text}>
            This example stays on this device; no staff member receives it.
          </Text>
        )}
      </Disclosure>
    </View>
  );
}
