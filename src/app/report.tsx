import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ReportLocation,
  validateReport,
  validateReportText,
  validateDetails,
} from "../domain";
import {
  Answers,
  Selection,
  emptySelection,
  validPath,
  reconcileAnswers,
  normalizeAnswers,
  defaultTitle,
  privacyFor,
  priorityFor,
  publicLocation,
  typeById,
  allowedQuestions,
  answerLabel,
} from "../taxonomy";
import { submitGuided, supabase, attachPhoto } from "../api";
import TaxonomyPicker from "../TaxonomyPicker";
import DependentQuestions from "../DependentQuestions";
import RelatedObservations from "../RelatedObservations";
import MediaPreview from "../MediaPreview";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationPicker from "../LocationPicker";
import ObservationTime from "../ObservationTime";
import { pickPhoto, pickVideo, PreparedPhoto } from "../photos";
import { Button, styles } from "../ui";
const steps = ["What did you notice?", "When and where?", "Review and share"];
export default function Report() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [titleOpen, setTitleOpen] = useState(false);
  const [step, setStep] = useState(0),
    [selection, setSelection] = useState<Selection>(emptySelection),
    [answers, setAnswers] = useState<Answers>({});
  const [title, setTitle] = useState(""),
    [titleEdited, setTitleEdited] = useState(false),
    [description, setDescription] = useState("");
  const [location, setLocation] = useState<ReportLocation | null>(null),
    [observedAt, setObservedAt] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [preparing, setPreparing] = useState(false),
    [consent, setConsent] = useState(false);
  const [message, setMessage] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{
    id: string;
    held: boolean;
    photoError?: string;
  } | null>(null);
  const lock = useRef(false),
    scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const client = useQueryClient();
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [step, saved]);
  const privacy = privacyFor(selection, answers),
    type = typeById(selection.typeId);
  function choose(next: Selection) {
    const kept = reconcileAnswers(next, answers);
    if (Object.keys(kept).length < Object.keys(answers).length)
      setNotice(
        "Details that no longer fit were removed. Your text, time, place and attachment are kept.",
      );
    setSelection(next);
    setAnswers(kept);
    if (!titleEdited) setTitle(defaultTitle(next, kept));
    setMessage("");
  }
  function answer(key: string, value: string) {
    const next = reconcileAnswers(selection, { ...answers, [key]: value });
    setAnswers(next);
    if (!titleEdited) setTitle(defaultTitle(selection, next));
    setMessage("");
  }
  function validate() {
    const prepared = normalizeAnswers(selection, answers);
    validateReportText(title, description);
    if (!location)
      throw Error("Choose where you observed this before reviewing.");
    validateReport(title, description, location.latitude, location.longitude);
    validateDetails(
      type!.legacyCategory,
      type!.legacyKind,
      {},
      observedAt ?? new Date().toISOString(),
    );
    if (photo && !consent)
      throw Error("Check the attachment for sensitive details or remove it.");
    return prepared;
  }
  function advance() {
    try {
      setMessage("");
      if (step === 0) {
        if (!validPath(selection)) throw Error("Choose what you noticed.");
        const prepared = normalizeAnswers(selection, answers);
        validateReportText(title, description);
        setAnswers(prepared);
      }
      if (step === 1) validate();
      Keyboard.dismiss();
      setStep(Math.min(2, step + 1));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }
  async function selectPhoto(kind: "photo" | "video" = "photo") {
    setPreparing(true);
    setMessage("");
    try {
      const next = await (kind === "video" ? pickVideo() : pickPhoto());
      if (next) {
        setPhoto(next);
        setConsent(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare this attachment.",
      );
    } finally {
      setPreparing(false);
    }
  }
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const prepared = validate();
      const result = await submitGuided(
        {
          selection,
          answers: prepared,
          title,
          description,
          location: location!,
          observed_at: observedAt ?? new Date().toISOString(),
        },
        photo ?? undefined,
      );
      await client.invalidateQueries({ queryKey: ["observations"] });
      await client.invalidateQueries({ queryKey: ["nearby-observations"] });
      await client.invalidateQueries({ queryKey: ["private", "my-reports"] });
      setSaved(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to share your observation. Your draft is still here.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function retryPhoto() {
    if (!saved || !photo || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await attachPhoto(saved.id, photo);
      setSaved({ ...saved, photoError: undefined });
      setMessage("");
    } catch (error) {
      setMessage(
        `Your observation remains saved. ${error instanceof Error ? error.message : "The attachment is still unavailable."}`,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const sharedLocation = location
    ? publicLocation(selection, answers, location)
    : null;
  const publicName =
    location?.privateAddress && privacy === "approximate"
      ? "Approximate map area"
      : sharedLocation?.name;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            gap: 16,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to map"
            disabled={busy || preparing}
            onPress={() => router.back()}
            style={{
              minHeight: 44,
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#9ce5d9" }}>← Back to map</Text>
          </Pressable>
          <Text style={{ color: "#9ce5d9", fontWeight: "700" }}>
            {saved ? "Observation saved" : `${step + 1} of 3`}
          </Text>
          <Text accessibilityRole="header" style={styles.heading}>
            {saved
              ? saved.held
                ? "Saved for private review"
                : supabase
                  ? "Observation shared"
                  : "Saved on this device"
              : steps[step]}
          </Text>
          <Text style={[styles.text, { fontSize: 13 }]}>
            {supabase
              ? "Community observation · Unverified"
              : "DEMO · Nothing is shared publicly"}
          </Text>
          {saved ? (
            <View style={styles.card}>
              <Text accessibilityRole="alert" style={styles.text}>
                {saved.held
                  ? "This observation is held for private review. It is not on the public map and no alert was sent."
                  : supabase
                    ? "Your observation was shared. It has not been confirmed by emergency services."
                    : "Your demo observation is saved on this device."}
              </Text>
              {saved.photoError && (
                <>
                  <Text style={styles.text}>
                    Your observation is saved, but the attachment needs another
                    try.
                  </Text>
                  <Button
                    label={busy ? "Retrying…" : "Retry attachment"}
                    disabled={busy}
                    onPress={() => {
                      void retryPhoto();
                    }}
                  />
                </>
              )}
              <Button
                label="View my observations"
                onPress={() => router.replace("/my-reports")}
              />
              <Button label="Return to map" onPress={() => router.back()} />
            </View>
          ) : (
            <>
              {step > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit what you noticed"
                  disabled={busy || preparing}
                  onPress={() => {
                    setStep(0);
                    setMessage("");
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={[styles.text, { flex: 1 }]} numberOfLines={2}>
                    {type?.label}
                  </Text>
                  <Text style={{ color: "#9ce5d9" }}>Edit</Text>
                </Pressable>
              )}
              {!!notice && (
                <Text accessibilityLiveRegion="polite" style={styles.text}>
                  {notice}
                </Text>
              )}
              {step === 0 && (
                <>
                  <TaxonomyPicker value={selection} onChange={choose} />
                  {validPath(selection) && (
                    <>
                      <Text style={[styles.heading, { fontSize: 22 }]}>
                        Tell us a little more
                      </Text>
                      <Text style={styles.text}>
                        Describe only what you witnessed. Avoid names, private
                        addresses and identifying details.
                      </Text>
                      <Text style={styles.text}>
                        What did you see? · Required
                      </Text>
                      <TextInput
                        accessibilityLabel="Description"
                        placeholder="A few words about what you noticed"
                        placeholderTextColor="#9ab3b7"
                        value={description}
                        onChangeText={setDescription}
                        style={[styles.input, { minHeight: 100 }]}
                        multiline
                        maxLength={2000}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit title"
                        onPress={() => setTitleOpen(!titleOpen)}
                        style={{ minHeight: 44, justifyContent: "center" }}
                      >
                        <Text style={styles.text}>
                          Title: {title}{" "}
                          <Text style={{ color: "#9ce5d9" }}>· Edit</Text>
                        </Text>
                      </Pressable>
                      {titleOpen && (
                        <TextInput
                          accessibilityLabel="Title"
                          value={title}
                          onChangeText={(value) => {
                            setTitle(value);
                            setTitleEdited(true);
                          }}
                          style={styles.input}
                          maxLength={100}
                        />
                      )}
                      <Button
                        label={
                          detailsOpen
                            ? "Hide optional details"
                            : "Add details · Optional"
                        }
                        onPress={() => setDetailsOpen(!detailsOpen)}
                      />
                      {detailsOpen && (
                        <DependentQuestions
                          selection={selection}
                          answers={answers}
                          onChange={answer}
                        />
                      )}
                      <RelatedObservations
                        value={selection}
                        onChange={choose}
                      />
                    </>
                  )}
                </>
              )}
              {step === 1 && (
                <>
                  <ObservationTime
                    value={observedAt}
                    onChange={setObservedAt}
                  />
                  <LocationPicker value={location} onChange={setLocation} />
                  <Text style={styles.text}>
                    {privacy === "restricted"
                      ? "This observation stays private for review. Any approved public version uses regional information, with no incident pin."
                      : privacy === "coarse"
                        ? "Your shared location will be generalized to protect sensitive places."
                        : "Your shared location will be approximate."}
                  </Text>
                  <View style={styles.card}>
                    <Text
                      accessibilityRole="header"
                      style={[styles.heading, { fontSize: 22 }]}
                    >
                      Add a photo or video
                    </Text>
                    <Text style={styles.text}>
                      Optional · One attachment. Video: MP4 or MOV, up to 60
                      seconds and 20 MB. Avoid faces, plates and sensitive
                      details, including voices. Container location metadata is
                      removed.
                    </Text>
                    <Text style={styles.text}>
                      {supabase
                        ? "Attachments stay private until separately reviewed."
                        : "Demo attachments stay on this device."}
                    </Text>
                    {photo && (
                      <MediaPreview
                        uri={photo.uri}
                        kind={photo.kind}
                        label="Selected attachment preview"
                      />
                    )}
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      <Button
                        label={
                          preparing
                            ? "Preparing attachment…"
                            : photo
                              ? "Replace with photo"
                              : "Choose photo"
                        }
                        disabled={preparing || busy}
                        onPress={() => {
                          void selectPhoto();
                        }}
                      />
                      <Button
                        label={photo ? "Replace with video" : "Choose video"}
                        disabled={preparing || busy}
                        onPress={() => {
                          void selectPhoto("video");
                        }}
                      />
                    </View>
                    {photo && (
                      <>
                        <Button
                          label="Remove attachment"
                          onPress={() => {
                            setPhoto(null);
                            setConsent(false);
                          }}
                        />
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityLabel="I checked this attachment for sensitive details"
                          accessibilityState={{ checked: consent }}
                          aria-checked={consent}
                          onPress={() => setConsent(!consent)}
                          style={{ paddingVertical: 12, minHeight: 44 }}
                        >
                          <Text style={styles.text}>
                            {consent ? "☑" : "☐"} I checked this attachment for
                            sensitive details
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </>
              )}
              {step === 2 && (
                <>
                  <View style={styles.card}>
                    <Text style={[styles.heading, { fontSize: 23 }]}>
                      {title}
                    </Text>
                    <Text style={styles.text}>{description}</Text>
                    {!!selection.relatedIds.length && (
                      <Text style={styles.text}>
                        Also noticed:{" "}
                        {selection.relatedIds
                          .map((id) => typeById(id)?.label)
                          .join(", ")}
                      </Text>
                    )}
                    {allowedQuestions(selection).map((q) =>
                      answers[q.id] !== undefined ? (
                        <Text key={q.id} style={styles.text}>
                          {q.label}: {answerLabel(q, answers[q.id])}
                        </Text>
                      ) : null,
                    )}
                    <Button
                      label="Edit observation"
                      onPress={() => setStep(0)}
                    />
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.text}>
                      Observed:{" "}
                      {observedAt
                        ? new Date(observedAt).toLocaleString()
                        : "Now, when shared"}
                    </Text>
                    <Text style={styles.text}>
                      Chosen place: {location?.reference_name || location?.name}
                    </Text>
                    <Text style={styles.text}>
                      Public display: {publicName}.{" "}
                      {privacy === "restricted"
                        ? "Regional information only after authorized review; no incident pin."
                        : "An approximate area, not the exact selected point."}
                    </Text>
                    <Button
                      label="Edit time or place"
                      onPress={() => setStep(1)}
                    />
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.text}>
                      {photo
                        ? `${photo.kind === "video" ? "Video" : "Photo"} attached · Private until reviewed`
                        : "No attachment"}
                    </Text>
                    {photo && (
                      <MediaPreview
                        uri={photo.uri}
                        kind={photo.kind}
                        label="Review attachment"
                      />
                    )}
                    <Button
                      label="Edit attachment"
                      onPress={() => setStep(1)}
                    />
                  </View>
                  <Text style={styles.text}>
                    {privacy === "restricted"
                      ? "This observation will be held for private review. In demo mode, no staff member receives it."
                      : "Unverified · Your choices do not create an official alert or staff danger flag."}
                  </Text>
                </>
              )}
              {priorityFor(selection, answers) && (
                <Text
                  style={{ color: "#e6c68b", fontSize: 14, lineHeight: 21 }}
                >
                  If someone is in immediate danger, contact emergency services.
                  Indraya does not dispatch responders.
                </Text>
              )}
            </>
          )}
          {!!message && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          {message.startsWith("Sign in") && supabase && (
            <Button label="Sign in" onPress={() => router.push("/account")} />
          )}
        </ScrollView>
        {!saved && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderColor: "#29464a",
              backgroundColor: "#071719",
              flexDirection: "row",
              gap: 12,
            }}
          >
            {step > 0 && (
              <View style={{ flex: 1 }}>
                <Button
                  label="Back"
                  disabled={busy || preparing}
                  onPress={() => {
                    setStep(step - 1);
                    setMessage("");
                  }}
                />
              </View>
            )}
            <View style={{ flex: 2 }}>
              <Button
                label={
                  step < 2
                    ? step === 1
                      ? "Review observation"
                      : "Continue"
                    : busy
                      ? "Sharing…"
                      : privacy === "restricted"
                        ? "Send for private review"
                        : "Share observation"
                }
                disabled={
                  preparing ||
                  busy ||
                  (step === 0 && !validPath(selection)) ||
                  (step === 1 && !!photo && !consent)
                }
                onPress={() => {
                  if (step < 2) advance();
                  else void save();
                }}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
