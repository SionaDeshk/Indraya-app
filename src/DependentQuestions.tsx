import { Text, TextInput, View } from "react-native";
import {
  Answers,
  Selection,
  allowedQuestions,
  visibleQuestion,
} from "./taxonomy";
import ChoiceSheet from "./ChoiceSheet";
import { styles } from "./ui";
export default function DependentQuestions({
  selection,
  answers,
  onChange,
}: {
  selection: Selection;
  answers: Answers;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      {allowedQuestions(selection)
        .filter((q) => visibleQuestion(q, answers))
        .map((question) => (
          <View key={question.id} style={{ gap: 6 }}>
            {question.type === "choice" ? (
              <ChoiceSheet
                label={question.label}
                value={String(answers[question.id] ?? "")}
                options={question.options}
                onChange={(value) => onChange(question.id, value)}
                placeholder="Not provided"
              />
            ) : (
              <>
                <Text style={styles.text}>{question.label} · optional</Text>
                <TextInput
                  accessibilityLabel={question.label}
                  placeholder={
                    question.type === "number"
                      ? "Approximate number"
                      : "What did you observe?"
                  }
                  placeholderTextColor="#9ab3b7"
                  style={styles.input}
                  keyboardType={
                    question.type === "number" ? "number-pad" : "default"
                  }
                  value={String(answers[question.id] ?? "")}
                  onChangeText={(value) => onChange(question.id, value)}
                  maxLength={question.maxLength ?? 8}
                />
              </>
            )}
          </View>
        ))}
    </View>
  );
}
