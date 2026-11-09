import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./api";
import { ReportLocation } from "./domain";
export type FollowedPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};
const demoKey = "indraya.followed-places.demo.v1";
export async function followedPlaces(): Promise<FollowedPlace[]> {
  if (!supabase)
    return JSON.parse((await AsyncStorage.getItem(demoKey)) || "[]");
  const { data, error } = await supabase
    .from("followed_places")
    .select("id,name,latitude,longitude")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
  }));
}
export async function followPlace(place: ReportLocation) {
  const value = {
    name: (place.privateAddress ? "Saved place" : place.name).slice(0, 160),
    latitude: Math.round(place.latitude * 100) / 100,
    longitude: Math.round(place.longitude * 100) / 100,
  };
  if (
    !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.latitude) > 90 ||
    Math.abs(value.longitude) > 180
  )
    throw Error("Invalid place");
  if (!supabase) {
    const rows = await followedPlaces();
    if (rows.length >= 50) throw Error("Remove a saved place first");
    if (
      !rows.some(
        (p) => p.latitude === value.latitude && p.longitude === value.longitude,
      )
    )
      await AsyncStorage.setItem(
        demoKey,
        JSON.stringify([{ ...value, id: `place-${Date.now()}` }, ...rows]),
      );
    return;
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw Error("Sign in first");
  const { error } = await supabase.from("followed_places").insert(value);
  if (error && error.code !== "23505") throw error;
}
export async function unfollowPlace(id: string) {
  if (!supabase) {
    await AsyncStorage.setItem(
      demoKey,
      JSON.stringify((await followedPlaces()).filter((p) => p.id !== id)),
    );
    return;
  }
  const { error } = await supabase
    .from("followed_places")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
