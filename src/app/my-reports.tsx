import { useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { myObservations, supabase } from "../api";
import { Observation } from "../domain";
import ObservationCard from "../ObservationCard";
import ObservationDetails from "../ObservationDetails";
import { Button, styles } from "../ui";
export default function MyReports() {
  const [selected, setSelected] = useState<Observation | null>(null);
  const q = useQuery({
    queryKey: ["private", "my-reports"],
    queryFn: myObservations,
    retry: 1,
  });
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
        My reports
      </Text>
      <Text style={styles.text}>
        {supabase
          ? "Your submitted observations, including those held for private review."
          : "DEMO · These reports stay on this device. Private-review reports are not sent to staff."}
      </Text>
      {q.isLoading && <Text style={styles.text}>Loading your reports…</Text>}
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
        <Text style={styles.text}>You have not submitted any reports yet.</Text>
      )}
      {q.data?.map((report) => (
        <View key={report.id} style={{ gap: 8 }}>
          <ObservationCard
            report={report}
            onPress={() => setSelected(report)}
          />
          <Text style={styles.text}>
            {report.status === "review"
              ? "Private review"
              : report.status === "hidden"
                ? "Hidden by moderation"
                : "Unverified / reviewed community report"}
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
            <Button label="Close my report" onPress={() => setSelected(null)} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
