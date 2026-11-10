import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { correctObservation } from "./api";
import { editTimeLeft } from "./myObservations";
import { useNow } from "./Clock";
import DependentQuestions from "./DependentQuestions";
import {
  normalizeAnswers,
  reconcileAnswers,
  type Selection,
  type Answers,
} from "./taxonomy";
import type { Observation } from "./domain";
import { Button, styles } from "./ui";
export default function ObservationCorrection({
  report,
  actor,
  current,
  onSaved,
}: {
  report: Observation;
  actor: string;
  current: () => boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [note, setNote] = useState(report.description),
    [answers, setAnswers] = useState<Answers>(report.answers ?? {}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const client = useQueryClient();
  const left = editTimeLeft(report, useNow());
  const selection: Selection = {
    domainId: report.domain_id ?? null,
    topicId: report.topic_id ?? null,
    typeId: report.event_type_id ?? null,
    relatedIds: report.related_type_ids ?? [],
  };
  if (!left && !editing)
    return (
      <Text style={[styles.text, { fontSize: 12 }]}>
        Correction window closed. Share a new observation for changed
        conditions.
      </Text>
    );
  return (
    <View style={{ gap: 12 }}>
      <Text style={[styles.text, { fontSize: 12 }]}>
        Correct notes and condition details for 10 minutes after sharing.{" "}
        {left ? `${Math.ceil(left / 60000)} min remaining.` : "Window closed."}{" "}
        Reviewed observations and those with community updates are locked.
      </Text>
      {!editing ? (
        <Button label="Edit observation" onPress={() => setEditing(true)} />
      ) : (
        <>
          <TextInput
            accessibilityLabel="Correct observation note"
            multiline
            maxLength={2000}
            value={note}
            onChangeText={setNote}
            editable={!busy && !!left}
            style={styles.input}
          />
          {!!selection.typeId && (
            <DependentQuestions
              selection={selection}
              answers={answers}
              onChange={(key, value) => {
                if (!busy && left)
                  setAnswers((a) =>
                    reconcileAnswers(selection, { ...a, [key]: value }),
                  );
              }}
            />
          )}
          <Button
            label={busy ? "Saving correction…" : "Save correction"}
            disabled={busy || !left}
            onPress={() => {
              if (!current()) {
                setMessage("Account changed. Reopen My observations.");
                return;
              }
              let clean: Answers;
              try {
                clean = selection.typeId
                  ? normalizeAnswers(selection, answers)
                  : answers;
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Review the condition details.",
                );
                return;
              }
              setBusy(true);
              setMessage("");
              void correctObservation(report, note, clean, actor)
                .then(async () => {
                  await Promise.all([
                    client.invalidateQueries({
                      queryKey: ["private", "my-reports"],
                    }),
                    client.invalidateQueries({ queryKey: ["observations"] }),
                    client.invalidateQueries({
                      queryKey: ["nearby-observations"],
                    }),
                  ]);
                  if (current()) onSaved();
                })
                .catch((e) => {
                  if (current())
                    setMessage(
                      e instanceof Error
                        ? e.message
                        : "Could not save correction.",
                    );
                })
                .finally(() => setBusy(false));
            }}
          />
          <Button
            label="Cancel correction"
            disabled={busy}
            onPress={() => setEditing(false)}
          />
        </>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}
