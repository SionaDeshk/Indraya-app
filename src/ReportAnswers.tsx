import { Text, View } from "react-native";
import { Observation } from "./domain";
import {
  catalog,
  answerLabel,
  domainById,
  topicById,
  typeById,
} from "./taxonomy";
import { styles } from "./ui";
export default function ReportAnswers({ report }: { report: Observation }) {
  return (
    <View style={{ gap: 8 }}>
      {report.domain_id && (
        <Text style={styles.text}>
          {domainById(report.domain_id)?.label} ›{" "}
          {topicById(report.topic_id)?.label} ›{" "}
          {typeById(report.event_type_id)?.label}
        </Text>
      )}
      {(report.related_type_ids ?? []).length > 0 && (
        <Text style={styles.text}>
          Also observed:{" "}
          {report.related_type_ids
            ?.map((id) => typeById(id)?.label ?? "Other observation")
            .join(", ")}
        </Text>
      )}
      {Object.entries(report.answers ?? {}).map(([key, value]) => {
        const question = catalog.questions[key];
        return question ? (
          <Text key={key} style={styles.text}>
            {question.label}: {answerLabel(question, value)}
          </Text>
        ) : null;
      })}
      {!report.answers && report.details?.animal && (
        <Text style={styles.text}>
          Animal: {report.details.animal}
          {report.details.count ? ` · about ${report.details.count}` : ""}
        </Text>
      )}
    </View>
  );
}
