import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
        },
      })
    : null;
export const localKey = "indraya.demo.observations.v1";
export async function observations(): Promise<Observation[]> {
  if (!supabase)
    return [
      ...demo,
      ...JSON.parse((await AsyncStorage.getItem(localKey)) || "[]"),
    ];
  const { data, error } = await supabase
    .from("observations")
    .select(
      "id,category,kind,title,description,latitude,longitude,place_name,observed_at,details,created_at,verification",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map(
    (row) => ({ ...row, source: "Community" }) as Observation,
  );
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
export async function attachPhoto(observationId: string, base64: string) {
  if (!supabase) throw Error("Shared photo storage is not connected.");
  const { data, error } = await supabase.functions.invoke("observation-photo", {
    body: { action: "upload", observationId, base64 },
  });
  if (error || data?.error || !data?.ok)
    throw Error(
      data?.error ||
        "The photo upload could not finish. Check your connection and retry; your report is already saved.",
    );
}
export async function submit(
  input: ReportInput,
  photo?: { base64: string; uri: string },
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
        (total, report) => total + (report.photo_uri?.length ?? 0),
        photo.uri.length,
      ) >
        4 * 1024 * 1024
    )
      throw Error(
        "Demo photo storage is full. Remove the attachment to submit without a photo.",
      );
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const report = {
      ...payload,
      id,
      created_at: new Date().toISOString(),
      verification: "unverified",
      source: "DEMO · this device",
      demo: true,
      ...(photo ? { photo_uri: photo.uri } : {}),
    };
    await AsyncStorage.setItem(localKey, JSON.stringify([...previous, report]));
    return { id };
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    throw Error("Sign in before publishing a community observation.");
  const { data, error } = await supabase
    .from("observations")
    .insert({ ...payload, author_id: user.id })
    .select("id")
    .single();
  if (error) throw error;
  if (photo) {
    try {
      await attachPhoto(data.id, photo.base64);
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
