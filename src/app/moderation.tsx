import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../api";
import { Observation } from "../domain";
import ObservationDetails from "../ObservationDetails";
import ChoiceSheet from "../ChoiceSheet";
import PhotoReview from "../PhotoReview";
import { Button, styles } from "../ui";
type QueueItem = { report: Observation; review_priority: string };
const options = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
function StaffItem({
  item,
  refresh,
}: {
  item: QueueItem;
  refresh: () => Promise<void>;
}) {
  const report = item.report;
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [reason, setReason] = useState(""),
    [reference, setReference] = useState(""),
    [basis, setBasis] = useState("privacy_review"),
    [privacy, setPrivacy] = useState(false),
    [verification, setVerification] = useState("unverified");
  const [title, setTitle] = useState(report.title),
    [description, setDescription] = useState(report.description);
  const [level, setLevel] = useState("none"),
    [state, setState] = useState("active"),
    [hours, setHours] = useState("1"),
    [summary, setSummary] = useState("");
  const history = useQuery({
    queryKey: ["staff", "history", report.id],
    enabled: open,
    retry: false,
    queryFn: async () => {
      if (!supabase)
        throw Error("Sign in with a server-provisioned staff account.");
      const { data, error } = await supabase
        .from("observation_assessments")
        .select(
          "id,level,lifecycle,reason,evidence_ref,assessed_by,assessed_at,expires_at",
        )
        .eq("observation_id", report.id)
        .order("id", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
  async function perform(rpc: string, args: Record<string, unknown>) {
    if (!supabase || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.rpc(rpc, args);
      if (error) throw error;
      setMessage("Staff action recorded.");
      await refresh();
      await history.refetch();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const field = (
    label: string,
    value: string,
    change: (s: string) => void,
    multiline = false,
    maxLength = 2000,
  ) => (
    <TextInput
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor="#9ab3b7"
      value={value}
      onChangeText={change}
      style={styles.input}
      multiline={multiline}
      maxLength={maxLength}
    />
  );
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        {report.title} · {report.status} · internal queue:{" "}
        {item.review_priority}
      </Text>
      <Button
        label={open ? "Close staff tools" : "Open staff review"}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <ObservationDetails report={report} />
          <Text style={styles.heading}>Publication & verification</Text>
          <Text style={styles.text}>
            Review text, answers, location and photo separately. Do not publish
            names, private addresses, victim identities or tactical details.
            This decision does not assign danger.
          </Text>
          {field("Private decision reason", reason, setReason, true)}
          {field(
            "Private supporting reference",
            reference,
            setReference,
            false,
            500,
          )}
          <ChoiceSheet
            label="Verification"
            value={verification}
            options={options(["unverified", "reviewed"])}
            onChange={setVerification}
          />
          {report.privacy_class === "restricted" && (
            <>
              <Button
                label={
                  privacy
                    ? "✓ Privacy review completed"
                    : "Confirm privacy review completed"
                }
                onPress={() => setPrivacy(!privacy)}
              />
              <ChoiceSheet
                label="Publication basis"
                value={basis}
                options={options([
                  "privacy_review",
                  "official_source",
                  "documented_consent",
                ])}
                onChange={setBasis}
              />
              {field("Safe public title", title, setTitle, false, 100)}
              {field(
                "Safe public description",
                description,
                setDescription,
                true,
              )}
              <Text style={styles.text}>
                Publication removes free-text answers from public view. Original
                content stays in the private audit. Missing or vulnerable-person
                reports require an official source or documented consent.
              </Text>
            </>
          )}
          <PhotoReview reportId={report.id} reason={reason} />
          {["approve", "hide", "review"].map((decision) => (
            <Button
              key={decision}
              label={`Record ${decision}`}
              disabled={busy || reason.trim().length < 5}
              onPress={() =>
                void perform("review_observation", {
                  report: report.id,
                  decision,
                  review_status: verification,
                  explanation: reason,
                  privacy_checked: privacy,
                  publication_basis: basis,
                  supporting_reference: reference,
                  public_title: title,
                  public_description: description,
                })
              }
            />
          ))}
          <Text style={styles.heading}>Separate staff risk assessment</Text>
          <Text style={styles.text}>
            Use observed evidence. Hazard and urgent grades require a supporting
            reference. Urgent expires within six hours; all active grades within
            24 hours. Resolving or disputing a grade does not verify the report.
          </Text>
          <ChoiceSheet
            label="Risk grade"
            value={level}
            options={options(["none", "caution", "hazard", "urgent"])}
            onChange={setLevel}
          />
          <ChoiceSheet
            label="Assessment lifecycle"
            value={state}
            options={options(["active", "resolved", "disputed"])}
            onChange={setState}
          />
          <ChoiceSheet
            label="Review after"
            value={hours}
            options={[1, 3, 6, 12, 24].map((h) => ({
              value: String(h),
              label: `${h} hours`,
            }))}
            onChange={setHours}
          />
          {field("Public assessment note", summary, setSummary, true, 160)}
          <Button
            label="Record risk assessment"
            disabled={
              busy ||
              reason.trim().length < 5 ||
              (level === "urgent" && Number(hours) > 6)
            }
            onPress={() =>
              void perform("set_observation_assessment", {
                report: report.id,
                risk_level: level,
                state,
                explanation: reason,
                evidence: reference,
                public_summary: summary,
                expiry:
                  state === "active" && level !== "none"
                    ? new Date(
                        Date.now() + Number(hours) * 3600000,
                      ).toISOString()
                    : null,
              })
            }
          />
          <Text style={styles.text}>Private assessment history</Text>
          {history.error && (
            <Text style={styles.text}>{history.error.message}</Text>
          )}
          {history.data?.map((row) => (
            <Text key={row.id} style={styles.text}>
              {row.assessed_at}: {row.level} · {row.lifecycle} · {row.reason} ·
              Reference: {row.evidence_ref || "none"} · Staff: {row.assessed_by}{" "}
              · Expiry: {row.expires_at || "none"}
            </Text>
          ))}
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
export default function Moderation() {
  const client = useQueryClient();
  const q = useQuery<QueueItem[]>({
    queryKey: ["staff", "review-queue"],
    retry: false,
    queryFn: async () => {
      if (!supabase)
        throw Error(
          "Connect Supabase and sign in with a server-provisioned moderator account.",
        );
      const { data, error } = await supabase.rpc("staff_review_queue");
      if (error) throw error;
      return data ?? [];
    },
  });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["staff"] }),
      client.invalidateQueries({ queryKey: ["observations"] }),
      client.invalidateQueries({ queryKey: ["nearby-observations"] }),
      client.invalidateQueries({ queryKey: ["private"] }),
    ]);
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 50 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label="← Back" onPress={() => router.back()} />
      <Text style={styles.heading}>Staff review</Text>
      <Text style={styles.text}>
        Access is checked by the server on every request. Private references and
        staff identity are excluded from public feeds.
      </Text>
      {q.isLoading && <Text style={styles.text}>Checking staff access…</Text>}
      {q.error && (
        <Text accessibilityRole="alert" style={styles.text}>
          {q.error.message}
        </Text>
      )}
      {q.data?.map((item) => (
        <StaffItem key={item.report.id} item={item} refresh={refresh} />
      ))}
      <Button label="Refresh review queue" onPress={() => void q.refetch()} />
    </ScrollView>
  );
}
