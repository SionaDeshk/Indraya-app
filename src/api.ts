import { demoAttachmentUri } from "./photos";
import { Platform } from "react-native";
import type { PreparedPhoto } from "./photos";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Selection,
  Answers,
  normalizeAnswers,
  typeById,
  catalog,
  publicLocation,
} from "./taxonomy";
import { normalizeExtent } from "./observationExtent";
import { createClient } from "@supabase/supabase-js";
import {
  demo,
  Observation,
  validateReport,
  validateDetails,
  ReportKind,
  ReportDetails,
} from "./domain";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;
export const localKey = "indraya.demo.observations.v1";
export async function observations(): Promise<Observation[]> {
  if (!supabase)
    return [
      ...demo,
      ...JSON.parse((await AsyncStorage.getItem(localKey)) || "[]"),
    ].filter(
      (report: Observation) => !report.status || report.status === "published",
    );
  const { data, error } = await supabase
    .from("observation_feed")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    if (
      /Failed to fetch|Network request failed|fetch failed|NetworkError/i.test(
        error.message,
      )
    ) {
      try {
        const cache = JSON.parse(
          (await AsyncStorage.getItem(`indraya.public-snapshot.v1.${url}`)) ||
            "null",
        );
        if (cache?.rows?.length && Date.now() - cache.savedAt < 7 * 86400000)
          return cache.rows.map((r: Observation) => ({
            ...r,
            offline_snapshot_at: new Date(cache.savedAt).toISOString(),
          }));
      } catch {
        /* No usable snapshot. */
      }
    }
    throw error;
  }
  const reports = (data ?? []).map((row: Observation) => ({
    ...row,
    source: "Community",
  }));
  try {
    await AsyncStorage.setItem(
      `indraya.public-snapshot.v1.${url}`,
      JSON.stringify({ savedAt: Date.now(), rows: reports.slice(0, 100) }),
    );
  } catch {
    /* Live data remains usable without a saved snapshot. */
  }
  return reports;
}
export type ReportInput = Pick<
  Observation,
  "category" | "title" | "description" | "latitude" | "longitude"
> & {
  kind: ReportKind;
  place_name: string;
  observed_at: string;
  details: ReportDetails;
};
export async function attachPhoto(
  observationId: string,
  attachment: string | PreparedPhoto,
) {
  const media =
    typeof attachment === "string" ? { base64: attachment } : attachment;
  if (!supabase) throw Error("Shared media storage is not connected.");
  const { data, error } = await supabase.functions.invoke("observation-photo", {
    body: {
      action: "upload",
      observationId,
      base64: media.base64,
      mediaKind: "kind" in media ? media.kind : "photo",
    },
  });
  if (error || data?.error || !data?.ok)
    throw Error(
      data?.error ||
        "The attachment upload could not finish. Check your connection and retry; your observation is already saved.",
    );
}
export async function submit(
  input: ReportInput,
  photo?: PreparedPhoto,
): Promise<{ id: string; photoError?: string }> {
  validateReport(
    input.title,
    input.description,
    input.latitude,
    input.longitude,
  );
  validateDetails(input.category, input.kind, input.details, input.observed_at);
  const location = {
    latitude: Math.round(input.latitude * 100) / 100,
    longitude: Math.round(input.longitude * 100) / 100,
  };
  const payload = {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    place_name: input.place_name.trim().slice(0, 160),
    ...location,
  };
  if (!supabase) {
    const previous: Observation[] = JSON.parse(
      (await AsyncStorage.getItem(localKey)) || "[]",
    );
    if (
      photo &&
      previous.reduce(
        (total, report) =>
          total + (report.media_bytes ?? report.photo_uri?.length ?? 0),
        photo.base64.length,
      ) >
        (Platform.OS === "web" ? 4 : 32) * 1024 * 1024
    )
      throw Error(
        "Device attachment storage is full. Remove the attachment to share without it.",
      );
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const report = {
      ...payload,
      id,
      created_at: new Date().toISOString(),
      verification: "unverified",
      source: "DEMO · this device",
      demo: true,
      ...(photo
        ? {
            photo_uri: await demoAttachmentUri(photo, id),
            media_kind: photo.kind ?? "photo",
            media_bytes: photo.base64.length,
          }
        : {}),
    };
    await AsyncStorage.setItem(localKey, JSON.stringify([...previous, report]));
    return { id };
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw Error("Sign in before sharing an observation.");
  const { data, error } = await supabase
    .from("observations")
    .insert({ ...payload, author_id: user.id })
    .select("id")
    .single();
  if (error) throw error;
  if (photo) {
    try {
      await attachPhoto(data.id, photo);
    } catch (error) {
      return {
        id: data.id,
        photoError:
          error instanceof Error
            ? error.message
            : "Report saved; photo upload failed.",
      };
    }
  }
  return { id: data.id };
}
export type GuidedReportInput = {
  selection: Selection;
  answers: Answers;
  title: string;
  description: string;
  location: import("./domain").ReportLocation;
  observed_at: string;
  extent?: import("./observationExtent").ObservationExtent | null;
};
export async function submitGuided(
  input: GuidedReportInput,
  photo?: PreparedPhoto,
  onStage?: (stage: "observation" | "attachment") => void,
): Promise<{ id: string; held: boolean; photoError?: string }> {
  onStage?.("observation");
  const answers = normalizeAnswers(input.selection, input.answers),
    type = typeById(input.selection.typeId)!;
  validateReport(
    input.title,
    input.description,
    input.location.latitude,
    input.location.longitude,
  );
  validateDetails(type.legacyCategory, type.legacyKind, {}, input.observed_at);
  const location = publicLocation(input.selection, answers, input.location);
  const payload = {
    category: type.legacyCategory,
    kind: type.legacyKind,
    title: input.title.trim(),
    description: input.description.trim(),
    latitude: location.latitude,
    longitude: location.longitude,
    place_name:
      input.location.privateAddress && location.privacy === "approximate"
        ? "Approximate map area"
        : location.name,
    observed_at: input.observed_at,
    details: {},
    extent: normalizeExtent(
      input.extent,
      input.selection.typeId!,
      location.privacy,
      location.latitude,
      location.longitude,
    ),
    taxonomy_version: catalog.version,
    domain_id: input.selection.domainId,
    topic_id: input.selection.topicId,
    event_type_id: input.selection.typeId,
    related_type_ids: input.selection.relatedIds,
    answers,
  };
  if (!supabase) {
    const previous: Observation[] = JSON.parse(
      (await AsyncStorage.getItem(localKey)) || "[]",
    );
    if (
      photo &&
      previous.reduce(
        (total, r) => total + (r.media_bytes ?? r.photo_uri?.length ?? 0),
        photo.base64.length,
      ) >
        (Platform.OS === "web" ? 4 : 32) * 1024 * 1024
    )
      throw Error(
        "Device attachment storage is full. Remove the attachment to share without it.",
      );
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      held = location.privacy === "restricted";
    const report = {
      ...payload,
      id,
      privacy_class: location.privacy,
      status: held ? "review" : "published",
      created_at: new Date().toISOString(),
      verification: "unverified",
      source: "DEMO · this device",
      demo: true,
      ...(photo
        ? {
            photo_uri: await demoAttachmentUri(photo, id),
            media_kind: photo.kind ?? "photo",
            media_bytes: photo.base64.length,
          }
        : {}),
    };
    await AsyncStorage.setItem(localKey, JSON.stringify([...previous, report]));
    return { id, held };
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw Error("Sign in before sharing an observation.");
  const version = await supabase
    .from("observation_catalog_versions")
    .select("version")
    .eq("version", catalog.version)
    .maybeSingle();
  if (version.error || !version.data)
    throw Error(
      "Sharing is unavailable for this app version until its update is released. Your draft is still here.",
    );
  const { data, error } = await supabase
    .from("observations")
    .insert({ ...payload, author_id: user.id })
    .select("id,status")
    .single();
  if (error)
    throw Error(
      "Unable to share your observation. Check your connection and account, then try again.",
    );
  const result = { id: data.id as string, held: data.status !== "published" };
  if (photo) {
    try {
      onStage?.("attachment");
      await attachPhoto(result.id, photo);
    } catch (error) {
      return {
        ...result,
        photoError:
          error instanceof Error
            ? error.message
            : "The attachment could not be added. Your observation is saved.",
      };
    }
  }
  return result;
}
export async function myObservations(): Promise<Observation[]> {
  if (!supabase)
    return JSON.parse((await AsyncStorage.getItem(localKey)) || "[]");
  const { data, error } = await supabase.rpc("my_observations");
  if (error)
    throw Error("Sign in to view your reports, or try again when connected.");
  return (data ?? []).map((report: Observation) => ({
    ...report,
    source: "Community",
  }));
}
export async function flag(id: string, reason: string) {
  if (!supabase)
    throw new Error(
      "Demo reports cannot be sent to moderators. Connect Supabase to enable flagging.",
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to flag a report.");
  const { error } = await supabase
    .from("report_flags")
    .insert({ observation_id: id, reporter_id: user.id, reason });
  if (error) throw error;
}
