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
import ExtentPicker from "../ExtentPicker";
import { ObservationExtent, normalizeExtent } from "../observationExtent";
import { newRequestId, type SubmissionAttempt } from "../submission";
import useObservationDraft from "../useObservationDraft";
import { Button, styles } from "../ui";
const steps = ["What did you notice?", "When and where?", "Review and share"];
export default function Report() {
  const [attempt, setAttempt] = useState<SubmissionAttempt | null>(null);
  const [extent, setExtent] = useState<ObservationExtent | null>(null);
  const [stage, setStage] = useState("observation");
  const [noteOpen, setNoteOpen] = useState(false);
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
    status?: string;
    photoError?: string;
  } | null>(null);
  const lock = useRef(false),
    scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const client = useQueryClient();
  const draft = useObservationDraft(
    {
      selection,
      answers,
      title,
      titleEdited,
      description,
      location,
      observedAt,
      attempt,
    },
    !!saved,
  );
  useEffect(() => {
    if (!draft.boundary.invalidated) return;
    setSelection(emptySelection);
    setAnswers({});
    setTitle("");
    setDescription("");
    setLocation(null);
    setPhoto(null);
    setConsent(false);
    setSaved(null);
    setExtent(null);
    setAttempt(null);
    setObservedAt(null);
    setNotice("");
    setMessage("");
  }, [draft.boundary.invalidated]);
  function restoreDraft() {
    const value = draft.pending;
    if (!value) return;
    setSelection(value.selection);
    setAnswers(value.answers);
    setTitle(value.title);
    setTitleEdited(value.titleEdited);
    setDescription(value.description);
    setNoteOpen(!!value.description);
    setLocation(value.location);
    setObservedAt(value.observedAt);
    setAttempt(value.attempt ?? null);
    setExtent(value.attempt?.extent ?? null);
    setStep(value.attempt ? 2 : 0);
    setNotice(
      "Draft restored. Recheck the saved time and place, reattach media, and redraw any extent before sharing.",
    );
    draft.accept();
  }
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
    setExtent(null);
    setSelection(next);
    setAnswers(kept);
    if (!titleEdited) setTitle(defaultTitle(next, kept));
    setMessage("");
  }
  function answer(key: string, value: string) {
    const next = reconcileAnswers(selection, { ...answers, [key]: value });
    setAnswers(next);
    if (privacyFor(selection, next) !== "approximate") setExtent(null);
    if (!titleEdited) setTitle(defaultTitle(selection, next));
    setMessage("");
  }
  function validate() {
    const prepared = normalizeAnswers(selection, answers);
    if (location)
      normalizeExtent(
        extent,
        selection.typeId!,
        privacy,
        location.latitude,
        location.longitude,
      );
    validateReportText(title, description);
    if (!location)
      throw Error("Choose where you observed this before reviewing.");
    validateReport(title, description, location.latitude, location.longitude);
    if (!attempt)
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
      if (next && draft.boundary.current()) {
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
    if (lock.current || !draft.ready || !draft.boundary.current()) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const prepared = validate();
      if (supabase && !draft.boundary.actor)
        throw Error("Sign in, then reopen sharing for your account.");
      const nextAttempt = attempt ?? {
        requestId: newRequestId(),
        observedAt: observedAt ?? new Date().toISOString(),
        extent: extent ?? null,
      };
      const safeLocation = publicLocation(selection, prepared, location!);
      const frozenLocation = {
        ...safeLocation,
        name: location!.privateAddress
          ? "Approximate map area"
          : safeLocation.name,
        privateAddress: false,
      };
      if (supabase) setAttempt(nextAttempt);
      setObservedAt(nextAttempt.observedAt);
      setLocation(frozenLocation);
      if (supabase)
        await draft.persistAttempt({
          selection,
          answers: prepared,
          title,
          titleEdited,
          description,
          location: frozenLocation,
          observedAt: nextAttempt.observedAt,
          attempt: nextAttempt,
        });
      const result = await submitGuided(
        {
          selection,
          answers: prepared,
          title,
          description,
          location: frozenLocation,
          observed_at: nextAttempt.observedAt,
          extent: nextAttempt.extent,
        },
        photo ?? undefined,
        setStage,
        { actor: draft.boundary.actor!, requestId: nextAttempt.requestId },
      );
      if (!draft.boundary.current()) return;
      await client.invalidateQueries({ queryKey: ["observations"] });
      await client.invalidateQueries({ queryKey: ["nearby-observations"] });
      await client.invalidateQueries({ queryKey: ["private", "my-reports"] });
      setSaved(result);
      await draft.clear();
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
    if (!saved || !photo || lock.current || !draft.boundary.current()) return;
    lock.current = true;
    setBusy(true);
    try {
      await attachPhoto(saved.id, photo, draft.boundary.actor ?? undefined);
      if (!draft.boundary.current()) return;
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
  if (draft.boundary.invalidated)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#071719" }}>
        <View style={styles.page}>
          <Text accessibilityRole="alert" style={styles.text}>
            Account changed. This form is locked and its private details have
            been cleared. Reopen sharing to continue with the correct account.
          </Text>
          <Button label="Back to map" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
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
              ? saved.status === "hidden"
                ? "Observation is hidden"
                : saved.held
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
          {!!draft.error && (
            <Text accessibilityRole="alert" style={styles.text}>
              {draft.error}
            </Text>
          )}
          {draft.pending && !saved && (
            <View style={styles.card}>
              <Text style={styles.heading}>Continue your draft?</Text>
              <Text style={styles.text}>
                {draft.pending.attempt
                  ? "A previous save needs confirmation. Continue to safely check the same observation; do not create a duplicate."
                  : "Saved on this device for this account. It has not been shared."}
              </Text>
              <Button label="Continue draft" onPress={restoreDraft} />
              {!draft.pending.attempt && (
                <Button
                  label="Discard draft"
                  onPress={() => {
                    void draft.discard();
                  }}
                />
              )}
            </View>
          )}
          {attempt && !saved && (
            <Text accessibilityRole="alert" style={styles.text}>
              A save may have completed. This draft is locked for a safe retry
              of the same observation. You can leave and resume it later.
            </Text>
          )}
          {saved ? (
            <View style={styles.card}>
              <Text accessibilityRole="alert" style={styles.text}>
                {saved.status === "hidden"
                  ? "This observation was saved previously and is now hidden. Retrying has not republished it."
                  : saved.held
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
              <Button
                label={saved.held ? "View status" : "View on map"}
                onPress={() =>
                  router.replace(
                    saved.held
                      ? {
                          pathname: "/my-reports",
                          params: { observation: saved.id },
                        }
                      : { pathname: "/", params: { observation: saved.id } },
                  )
                }
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
              {privacy === "restricted" && (
                <Text style={{ color: "#e6c68b", lineHeight: 22 }}>
                  This observation will go to private review. It will not appear
                  on the public map yet.
                </Text>
              )}
              {step === 0 && (
                <>
                  <TaxonomyPicker value={selection} onChange={choose} />
                  {validPath(selection) && (
                    <>
                      <Button
                        label={
                          noteOpen
                            ? "Hide note"
                            : description
                              ? "Edit note"
                              : "Add a note · Optional"
                        }
                        onPress={() => setNoteOpen(!noteOpen)}
                      />
                      {noteOpen && (
                        <>
                          <Text style={styles.text}>
                            Describe only what you witnessed. Avoid identifying
                            people or private addresses.
                          </Text>
                          <TextInput
                            accessibilityLabel="Description"
                            placeholder="Anything else you want to add?"
                            placeholderTextColor="#9ab3b7"
                            value={description}
                            onChangeText={setDescription}
                            style={[styles.input, { minHeight: 72 }]}
                            multiline
                            maxLength={2000}
                          />
                        </>
                      )}
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
                  <LocationPicker
                    value={location}
                    onChange={(next) => {
                      setLocation(next);
                      setExtent(null);
                    }}
                  />
                  <ExtentPicker
                    value={extent}
                    onChange={setExtent}
                    type={selection.typeId!}
                    privacy={privacy}
                    location={location}
                  />
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
                      disabled={busy || !!attempt}
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
                      disabled={busy || !!attempt}
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
                    {!!attempt && (
                      <>
                        <Text style={styles.text}>
                          After a restart, select the attachment again if
                          needed. An attachment already saved will not be
                          replaced.
                        </Text>
                        <Button
                          label="Reattach photo"
                          disabled={busy || preparing}
                          onPress={() => {
                            void selectPhoto();
                          }}
                        />
                        <Button
                          label="Reattach video"
                          disabled={busy || preparing}
                          onPress={() => {
                            void selectPhoto("video");
                          }}
                        />
                        {!!photo && (
                          <Pressable
                            accessibilityRole="checkbox"
                            accessibilityLabel="I checked this attachment for sensitive details"
                            accessibilityState={{ checked: consent }}
                            onPress={() => setConsent(!consent)}
                            style={{ minHeight: 44, justifyContent: "center" }}
                          >
                            <Text style={styles.text}>
                              {consent ? "✓ " : ""}I checked this attachment for
                              sensitive details
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}
                    <Button
                      label="Edit attachment"
                      disabled={busy || !!attempt}
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
                  disabled={busy || preparing || !!attempt}
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
                      ? stage === "attachment"
                        ? "Uploading attachment…"
                        : "Sharing observation…"
                      : privacy === "restricted"
                        ? "Send for private review"
                        : "Share observation"
                }
                disabled={
                  !draft.ready ||
                  !!draft.pending ||
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
