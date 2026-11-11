import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { supabase } from "../api";
import { Button, styles } from "../ui";
export default function Account() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const [followedAreas, setFollowedAreas] = useState<string[]>([]);
  useEffect(() => { let active = true; void AsyncStorage.getItem("nuna.followedAreas.v1").then((value) => { if (active && value) { try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) setFollowedAreas(parsed.filter((x): x is string => typeof x === "string")); } catch { /* Ignore invalid cache. */ } } }); return () => { active = false; }; }, []);
  function saveAreas(next: string[]) { setFollowedAreas(next); void AsyncStorage.setItem("nuna.followedAreas.v1", JSON.stringify(next)).catch(() => setMessage("Unable to save followed areas on this device.")); }
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      setUser(s?.user.id ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    if (!supabase || !user) {
      setName("");
      return;
    }
    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) {
          if (error) setMessage("Unable to load your profile.");
          else setName(data?.display_name ?? "");
        }
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function auth(signup: boolean) {
    if (!supabase) return;
    const result = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setMessage(
      result.error?.message ??
        (signup ? "Check your email to confirm your account." : "Signed in."),
    );
  }
  async function profile() {
    if (!supabase || !user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user, display_name: name });
    setMessage(
      error?.message ??
        "Profile saved. Your email is never included on public reports.",
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#080d1a" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: "#a99bdf", letterSpacing: 4, fontWeight: "700", fontSize: 16 }}>N U N A</Text>
      <Button label="← Back" onPress={() => router.back()} />
      <Text style={styles.heading}>Your point of awareness.</Text>
      {!supabase ? (
        <Text style={styles.text}>
          Accounts are not available in this demo build. Your demo reports stay
          on this device.
        </Text>
      ) : user ? (
        <>
          <TextInput
            accessibilityLabel="Display name"
            placeholder="Display name"
            placeholderTextColor="#9ab3b7"
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={60}
          />
          <Button
            label="Save profile"
            onPress={() => {
              void profile();
            }}
          />
          <Button
            label="Sign out"
            onPress={() => {
              void supabase?.auth.signOut().then(({ error }) => {
                setMessage(error?.message ?? "Signed out.");
                void queryClient.resetQueries({ queryKey: ["report-photo"] });
              });
            }}
          />
        </>
      ) : (
        <>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9ab3b7"
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#9ab3b7"
            style={styles.input}
          />
          <Button
            label="Sign in"
            onPress={() => {
              void auth(false);
            }}
          />
          <Button
            label="Create account"
            onPress={() => {
              void auth(true);
            }}
          />
        </>
      )}
      <View style={[styles.card, { borderWidth: 1, borderColor: "#30365d" }]}>
        <Text style={{ color: "#a99bdf", letterSpacing: 2, fontSize: 11 }}>YOUR ALASKA</Text>
        <Text style={[styles.heading, { fontSize: 23 }]}>Following areas</Text>
        <Text style={styles.text}>Keep a personal list of places to watch. Saved on this device; alerts and account sync are not enabled yet.</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput accessibilityLabel="Area to follow" placeholder="Town, region or landmark" placeholderTextColor="#9ab3b7" value={areaInput} onChangeText={setAreaInput} maxLength={80} style={[styles.input, { flex: 1 }]} />
          <Button label="Follow +" onPress={() => { const name = areaInput.trim(); if (!name || followedAreas.some((a) => a.toLowerCase() === name.toLowerCase()) || followedAreas.length >= 30) return; saveAreas([...followedAreas, name]); setAreaInput(""); }} />
        </View>
        {followedAreas.length === 0 && <Text style={styles.text}>No followed areas yet.</Text>}
        {followedAreas.map((area) => <View key={area} style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" }}><Text style={[styles.text, { flex: 1 }]}>{area}</Text><Button label="Remove" onPress={() => saveAreas(followedAreas.filter((a) => a !== area))} /></View>)}
      </View>
      <Button
        label="Moderator review"
        onPress={() => router.push("/moderation")}
      />
      <Text style={styles.text}>{message}</Text>
    </ScrollView>
  );
}
