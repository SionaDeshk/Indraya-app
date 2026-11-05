import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { supabase } from "../api";
import { Button, styles } from "../ui";
export default function Account() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
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
    <ScrollView contentContainerStyle={styles.page}>
      <Button label="← Back" onPress={() => router.back()} />
      <Text style={styles.heading}>Your point of awareness.</Text>
      {!supabase ? (
        <Text style={styles.text}>
          Demo mode. Connect Supabase using .env.example to enable accounts. No
          simulated authentication is performed.
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
              void supabase?.auth
                .signOut()
                .then(({ error }) =>
                  setMessage(error?.message ?? "Signed out."),
                );
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
      <Button
        label="Moderator review"
        onPress={() => router.push("/moderation")}
      />
      <Text style={styles.text}>{message}</Text>
    </ScrollView>
  );
}
