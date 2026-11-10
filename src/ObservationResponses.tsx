import { useState } from "react";
import { Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { supabase } from "./api";
import { Observation } from "./domain";
import { isActive } from "./observationLifecycle";
import { useNow } from "./Clock";
import ObservationTime from "./ObservationTime";
import { Button, styles } from "./ui";
export default function ObservationResponses({
  report,
}: {
  report: Observation;
}) {
  const [open, setOpen] = useState(false),
    [seenAt, setSeenAt] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const now = useNow(),
    client = useQueryClient(),
    responseQuery = useQuery({
      queryKey: ["observation-responses", report.id],
      enabled: !!supabase && !report.demo,
      refetchInterval: 120000,
      refetchIntervalInBackground: false,
      queryFn: async () => {
        const { data, error } = await supabase!.rpc(
          "observation_response_summary",
          { report: report.id },
        );
        if (error) throw Error(error.message);
        return data as Observation["response_summary"];
      },
    }),
    summary = responseQuery.data ?? report.response_summary;
  async function respond(choice: string) {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setMessage("Sign in to add a firsthand update.");
        return;
      }
      const { error } = await supabase.rpc("respond_to_observation", {
        report: report.id,
        choice,
        seen_at: seenAt ?? new Date().toISOString(),
      });
      if (error) throw Error(error.message);
      setMessage(
        "Your firsthand update was saved. It does not verify safety or reset the original observation's age.",
      );
      await client.invalidateQueries({
        queryKey: ["observation-responses", report.id],
      });
      await client.invalidateQueries({ queryKey: ["observations"] });
      await client.invalidateQueries({ queryKey: ["nearby-observations"] });
      setOpen(false);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Update unavailable. Check your account and try later.",
      );
    } finally {
      setBusy(false);
    }
  }
  const count =
    (summary?.observed ?? 0) +
    (summary?.changed ?? 0) +
    (summary?.not_observed ?? 0);
  return (
    <View style={{ gap: 10 }}>
      <Button
        label={
          open
            ? "Close community updates"
            : count
              ? `${count} firsthand update${count === 1 ? "" : "s"}`
              : "Community updates"
        }
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          {summary && count > 0 && (
            <Text style={styles.text}>
              {summary.observed} observed too · {summary.changed} changed ·{" "}
              {summary.not_observed} did not observe
              {summary.latest
                ? ` · Latest ${new Date(summary.latest).toLocaleString()}`
                : ""}
            </Text>
          )}
          <Text style={styles.text}>
            Firsthand updates do not verify safety or renew the original
            observation.
          </Text>
          {report.demo ? (
            <Text style={styles.text}>
              Demo updates stay on this device. Sign in to a connected project
              to share a firsthand update.
            </Text>
          ) : isActive(report, now) ? (
            <>
              <ObservationTime value={seenAt} onChange={setSeenAt} />
              {[
                ["observed", "I observed this too"],
                ["changed", "Conditions have changed"],
                ["not_observed", "I didn't observe this"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  label={label}
                  disabled={busy}
                  onPress={() => {
                    void respond(value);
                  }}
                />
              ))}
            </>
          ) : (
            <Text style={styles.text}>
              This observation is outdated; share a new observation if you have
              current information.
            </Text>
          )}
        </>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
      {message.startsWith("Sign in") && (
        <Button label="Sign in" onPress={() => router.push("/account")} />
      )}
    </View>
  );
}
