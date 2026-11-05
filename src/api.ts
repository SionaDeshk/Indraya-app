import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { demo, Observation, validateReport } from "./domain";
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
const localKey = "indraya.demo.observations.v1";
export async function observations(): Promise<Observation[]> {
  if (!supabase)
    return [
      ...demo,
      ...JSON.parse((await AsyncStorage.getItem(localKey)) || "[]"),
    ];
  const { data, error } = await supabase
    .from("observations")
    .select(
      "id,category,title,description,latitude,longitude,created_at,verification",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map(
    (row) => ({ ...row, source: "Community" }) as Observation,
  );
}
export async function submit(
  input: Pick<
    Observation,
    "category" | "title" | "description" | "latitude" | "longitude"
  >,
  photo?: string,
) {
  validateReport(
    input.title,
    input.description,
    input.latitude,
    input.longitude,
  );
  // Deliberately reduce public precision to roughly 1km. Never upload a device's live location automatically.
  const location = {
    latitude: Math.round(input.latitude * 100) / 100,
    longitude: Math.round(input.longitude * 100) / 100,
  };
  if (!supabase) {
    const previous = JSON.parse((await AsyncStorage.getItem(localKey)) || "[]");
    const report = {
      ...input,
      ...location,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      verification: "unverified",
      source: "DEMO · this device",
      demo: true,
    };
    await AsyncStorage.setItem(localKey, JSON.stringify([...previous, report]));
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    throw new Error("Sign in before publishing a community observation.");
  if (photo)
    throw new Error(
      "Photo upload is not enabled yet. Remove the attachment to submit.",
    );
  const { error } = await supabase
    .from("observations")
    .insert({ ...input, ...location, author_id: user.id });
  if (error) throw error;
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
