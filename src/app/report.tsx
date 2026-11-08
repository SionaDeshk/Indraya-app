import { useEffect, useRef, useState } from "react";
import {
  Image,
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
  catalog,
  emptySelection,
  validPath,
  reconcileAnswers,
  normalizeAnswers,
  defaultTitle,
  privacyFor,
  priorityFor,
  publicLocation,
  typeById,
  domainById,
  topicById,
  allowedQuestions,
  answerLabel,
} from "../taxonomy";
import { submitGuided, supabase, attachPhoto } from "../api";
import TaxonomyPicker from "../TaxonomyPicker";
import DependentQuestions from "../DependentQuestions";
import ChoiceSheet from "../ChoiceSheet";
import LocationPicker from "../LocationPicker";
import ObservationTime from "../ObservationTime";
import { pickPhoto, PreparedPhoto } from "../photos";
import { Button, styles } from "../ui";
const steps = ["What happened", "Details", "When & where", "Photo", "Review"];
export default function Report() {
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
        "Type-specific answers were updated. Your description, time, location and photo are preserved.",
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
      throw Error("Check the photo for sensitive details or remove it.");
    return prepared;
  }
  function advance() {
    try {
      setMessage("");
      if (step === 0 && !validPath(selection))
        throw Error("Choose a category, topic and observation.");
      if (step === 1) {
        const prepared = normalizeAnswers(selection, answers);
        validateReportText(title, description);
        setAnswers(prepared);
      }
      if (step === 2) {
        if (!location) throw Error("Choose where you observed this.");
        validateDetails(
          type!.legacyCategory,
          type!.legacyKind,
          {},
          observedAt ?? new Date().toISOString(),
        );
      }
      if (step === 3) validate();
      Keyboard.dismiss();
      setStep(Math.min(4, step + 1));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }
  async function selectPhoto() {
    setPreparing(true);
    setMessage("");
    try {
      const next = await pickPhoto();
      if (next) {
        setPhoto(next);
        setConsent(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare this photo.",
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
          : "Unable to save your report. Please try again.",
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
      await attachPhoto(saved.id, photo.base64);
      setSaved({ ...saved, photoError: undefined });
      setMessage("");
    } catch (error) {
      setMessage(
        `Your report remains saved. ${error instanceof Error ? error.message : "The photo is still unavailable."}`,
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
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 50 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label="← Back to map" onPress={() => router.back()} />
      <Text accessibilityRole="header" style={styles.heading}>
        {saved ? "Observation saved" : "Share what you see."}
      </Text>
      <Text style={styles.text}>
        {supabase ? "Community report" : "DEMO · Saved only on this device"} ·
        Unverified
      </Text>
      {saved ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.text}>
            {saved.held
              ? "This report is held for private review. It is not on the public map and no alert was sent."
              : supabase
                ? "Your community observation was saved. It has not been confirmed by emergency services."
                : "Your demo observation is saved on this device. Nothing was published publicly."}
          </Text>
          {saved.photoError && (
            <>
              <Text style={styles.text}>
                The report is saved, but its photo could not be attached.
              </Text>
              <Button
                label={busy ? "Retrying…" : "Retry photo attachment"}
                disabled={busy}
                onPress={() => {
                  void retryPhoto();
                }}
              />
            </>
          )}
          <Button
            label="View my reports"
            onPress={() => router.replace("/my-reports")}
          />
          <Button label="Return to map" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <Text style={{ color: "#9ce5d9", fontWeight: "700" }}>
            Step {step + 1} of {steps.length} · {steps[step]}
          </Text>
          {notice.length > 0 && (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              {notice}
            </Text>
          )}
          {step === 0 && <TaxonomyPicker value={selection} onChange={choose} />}
          {step > 0 && (
            <View style={styles.card}>
              <Text style={styles.text}>
                {domainById(selection.domainId ?? "")?.label} ›{" "}
                {topicById(selection.topicId)?.label} › {type?.label}
              </Text>
              <Button
                label="Change category or observation"
                onPress={() => {
                  setStep(0);
                  setMessage("");
                }}
              />
            </View>
          )}
          {step === 1 && (
            <>
              <Text
                accessibilityRole="header"
                style={[styles.heading, { fontSize: 24 }]}
              >
                Tell us what you observed
              </Text>
              <Text style={styles.text}>
                Follow-up details are optional. Choose Not sure when you cannot
                tell. Do not identify victims, private homes or vulnerable
                people.
              </Text>
              <DependentQuestions
                selection={selection}
                answers={answers}
                onChange={answer}
              />
              <Text style={styles.text}>
                Anything related? Add up to three observations without assuming
                what caused them.
              </Text>
              {selection.relatedIds.map((id) => (
                <View key={id} style={styles.card}>
                  <Text style={styles.text}>{typeById(id)?.label}</Text>
                  <Button
                    label={`Remove ${typeById(id)?.label}`}
                    onPress={() =>
                      choose({
                        ...selection,
                        relatedIds: selection.relatedIds.filter(
                          (item) => item !== id,
                        ),
                      })
                    }
                  />
                </View>
              ))}
              {selection.relatedIds.length < 3 && (
                <ChoiceSheet
                  label="Related observation"
                  options={Object.values(catalog.types)
                    .filter(
                      (event) =>
                        event.id !== selection.typeId &&
                        !selection.relatedIds.includes(event.id),
                    )
                    .map((event) => ({
                      value: event.id,
                      label: event.label,
                      description: domainById(event.family)?.label,
                    }))}
                  placeholder="Add related observation (optional)"
                  onChange={(id) =>
                    choose({
                      ...selection,
                      relatedIds: [...selection.relatedIds, id],
                    })
                  }
                />
              )}
              <Text style={styles.text}>Title · editable</Text>
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
              <Text style={styles.text}>Description · required</Text>
              <TextInput
                accessibilityLabel="Description"
                placeholder="What did you directly observe?"
                placeholderTextColor="#9ab3b7"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { minHeight: 120 }]}
                multiline
                maxLength={2000}
              />
            </>
          )}
          {step === 2 && (
            <>
              <ObservationTime value={observedAt} onChange={setObservedAt} />
              <LocationPicker value={location} onChange={setLocation} />
              <Text style={styles.text}>
                {privacy === "restricted"
                  ? "This report goes to private review. No incident pin is published automatically; any permitted public version uses regional information only."
                  : privacy === "coarse"
                    ? "This observation uses a more generalized public area to protect sensitive locations."
                    : "Only an approximate observation area is stored and shared."}
              </Text>
            </>
          )}
          {step === 3 && (
            <View style={styles.card}>
              <Text
                accessibilityRole="header"
                style={[styles.heading, { fontSize: 24 }]}
              >
                Add a photo · optional
              </Text>
              <Text style={styles.text}>
                Avoid identifying faces, plates and sensitive locations.
                Location metadata is removed.{" "}
                {supabase
                  ? "New photos stay private until separately reviewed."
                  : "Demo photos stay on this device."}
              </Text>
              {photo && (
                <Image
                  accessibilityLabel="Selected photo preview"
                  source={{ uri: photo.uri }}
                  style={{ height: 210, width: "100%", borderRadius: 16 }}
                  resizeMode="contain"
                />
              )}
              <Button
                label={
                  preparing
                    ? "Preparing photo…"
                    : photo
                      ? "Choose another photo"
                      : "Choose photo"
                }
                disabled={preparing || busy}
                onPress={() => {
                  void selectPhoto();
                }}
              />
              {photo && (
                <>
                  <Button
                    label="Remove attachment"
                    onPress={() => {
                      setPhoto(null);
                      setConsent(false);
                    }}
                  />
                  <Button
                    label={`${consent ? "☑" : "☐"} I checked this photo for sensitive details`}
                    onPress={() => setConsent(!consent)}
                  />
                </>
              )}
            </View>
          )}
          {step === 4 && (
            <>
              <Text
                accessibilityRole="header"
                style={[styles.heading, { fontSize: 24 }]}
              >
                Review your observation
              </Text>
              <View style={styles.card}>
                <Text style={styles.heading}>{title}</Text>
                <Text style={styles.text}>{description}</Text>
                <Text style={styles.text}>
                  Related:{" "}
                  {selection.relatedIds.length
                    ? selection.relatedIds
                        .map((id) => typeById(id)?.label)
                        .join(", ")
                    : "None"}
                </Text>
                {allowedQuestions(selection).map((q) =>
                  answers[q.id] !== undefined ? (
                    <Text key={q.id} style={styles.text}>
                      {q.label}: {answerLabel(q, answers[q.id])}
                    </Text>
                  ) : null,
                )}
                <Button label="Edit details" onPress={() => setStep(1)} />
              </View>
              <View style={styles.card}>
                <Text style={styles.text}>
                  Observed:{" "}
                  {observedAt
                    ? new Date(observedAt).toLocaleString()
                    : "Now, when submitted"}
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
                <Button label="Edit time or place" onPress={() => setStep(2)} />
              </View>
              <View style={styles.card}>
                <Text style={styles.text}>
                  {photo
                    ? "Photo attached; sensitive details checked. Shared uploads remain private until reviewed."
                    : "No photo attached."}
                </Text>
                {photo && (
                  <Image
                    accessibilityLabel="Review photo"
                    source={{ uri: photo.uri }}
                    style={{ width: "100%", height: 160 }}
                    resizeMode="contain"
                  />
                )}
                <Button label="Edit photo" onPress={() => setStep(3)} />
              </View>
              <Text style={styles.text}>
                Community report · Unverified · Staff risk not assessed. Your
                selections do not create a staff danger flag or an official
                alert.
              </Text>
              {privacy === "restricted" && (
                <Text style={styles.text}>
                  This report will be held for review. In demo mode, no staff
                  member receives it.
                </Text>
              )}
            </>
          )}
          {priorityFor(selection, answers) && (
            <Text style={{ color: "#e6c68b", fontSize: 14, lineHeight: 21 }}>
              If someone is in immediate danger, contact emergency services.
              Indraya does not dispatch responders.
            </Text>
          )}
          {message.length > 0 && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          {step > 0 && (
            <Button
              label="Previous step"
              onPress={() => {
                setStep(step - 1);
                setMessage("");
              }}
            />
          )}
          {step < 4 ? (
            <Button
              label={
                step === 3
                  ? photo
                    ? "Review observation"
                    : "Skip photo and review"
                  : "Continue"
              }
              disabled={
                preparing ||
                busy ||
                (step === 0 && !validPath(selection)) ||
                (step === 3 && !!photo && !consent)
              }
              onPress={advance}
            />
          ) : (
            <Button
              label={
                busy
                  ? "Saving…"
                  : privacy === "restricted"
                    ? "Submit for private review"
                    : "Submit unverified observation"
              }
              disabled={busy}
              onPress={() => {
                void save();
              }}
            />
          )}
          {message.startsWith("Sign in") && supabase && (
            <Button label="Sign in" onPress={() => router.push("/account")} />
          )}
        </>
      )}
      {saved && message.length > 0 && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </ScrollView>
  );
}
