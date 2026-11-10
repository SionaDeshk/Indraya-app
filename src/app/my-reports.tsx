import { newestFirst } from "../myObservations";
import ObservationCorrection from "../ObservationCorrection";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { myObservations, supabase } from "../api";
import { Observation } from "../domain";
import ObservationCard from "../ObservationCard";
import ObservationDetails from "../ObservationDetails";
import useActorBoundary from "../useActorBoundary";
import { useNow } from "../Clock";
import { observationStatus } from "../observationLifecycle";
import { Button, styles } from "../ui";
export default function MyReports() {
  const now = useNow();
  const boundary = useActorBoundary();
  const { observation } = useLocalSearchParams<{ observation?: string }>();
  const opened = useRef("");
  const [selected, setSelected] = useState<Observation | null>(null);
  const q = useQuery({
    queryKey: ["private", "my-reports", boundary.actor],
    enabled: boundary.actor !== undefined && !boundary.invalidated,
    queryFn: myObservations,
    retry: 1,
    refetchInterval: 120000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (observation && opened.current !== observation && q.data) {
      const row = q.data.find((r) => r.id === observation);
      if (row) setSelected(row);
      opened.current = observation;
    }
  }, [observation, q.data]);
  useEffect(() => {
    if (selected && (!q.data || !q.data.some((r) => r.id === selected.id)))
      setSelected(null);
  }, [q.data, selected]);
  if (boundary.invalidated)
    return (
      <View style={styles.page}>
        <Text accessibilityRole="alert" style={styles.text}>
          Account changed. Reopen My observations for the current account.
        </Text>
        <Button label="Back to map" onPress={() => router.replace("/")} />
      </View>
    );
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
    >
      <Button label="← Back to map" onPress={() => router.dismissTo("/")} />
      <Text accessibilityRole="header" style={styles.heading}>
        My observations
      </Text>
      <Text style={styles.text}>
        {supabase
          ? "Your observations, including private holds and outdated conditions. Outdated does not mean resolved."
          : "DEMO · These reports stay on this device. Private-review reports are not sent to staff."}
      </Text>
      {q.isLoading && (
        <Text style={styles.text}>Loading your observations…</Text>
      )}
      {q.error && (
        <>
          <Text accessibilityRole="alert" style={styles.text}>
            Unable to load your reports. Sign in or try again when connected.
          </Text>
          <Button
            label="Retry my reports"
            onPress={() => {
              void q.refetch();
            }}
          />
          {supabase && (
            <Button label="Sign in" onPress={() => router.push("/account")} />
          )}
        </>
      )}
      {q.data?.length === 0 && (
        <Text style={styles.text}>
          You have not shared any observations yet.
        </Text>
      )}
      <Text style={[styles.text, { fontSize: 12 }]}>Newest shared first</Text>
      {q.data &&
        newestFirst(q.data).map((report) => (
          <View key={report.id} style={{ gap: 8 }}>
            <ObservationCard
              report={report}
              onPress={() => setSelected(report)}
            />
            <Text style={styles.text}>
              {observationStatus(report, now).label} ·{" "}
              {observationStatus(report, now).explanation}
            </Text>
          </View>
        ))}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0006",
          }}
        >
          <ScrollView
            style={{
              maxHeight: "85%",
              backgroundColor: "#10282c",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            contentContainerStyle={{ padding: 24, paddingBottom: 45, gap: 16 }}
          >
            {selected && <ObservationDetails report={selected} />}
            {selected && boundary.actor && (
              <ObservationCorrection
                key={selected.id}
                report={selected}
                actor={boundary.actor}
                current={boundary.current}
                onSaved={() => setSelected(null)}
              />
            )}
            <Button label="Close my report" onPress={() => setSelected(null)} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
