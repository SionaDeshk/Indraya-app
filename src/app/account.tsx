import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../api";
import { Button, styles } from "../ui";
export default function Account() {
  const queryClient = useQueryClient();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const confirmation = useRef<{
    code: string;
    promise: Promise<boolean>;
  } | null>(null);
  useEffect(() => {
    if (!supabase || !code) return;
    let active = true;
    if (!confirmation.current || confirmation.current.code !== code) {
      confirmation.current = {
        code,
        promise: supabase.auth
          .exchangeCodeForSession(code)
          .then(({ error }) => !error)
          .catch(() => false),
      };
    }
    void confirmation.current.promise.then((ok) => {
      if (active)
        setMessage(
          ok
            ? "Email confirmed. You are signed in."
            : "Confirmation link invalid or expired. Try signing in or request a new confirmation.",
        );
    });
    return () => {
      active = false;
    };
  }, [code]);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let generation = 0;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (generation === 0) setUser(data.user?.id ?? null);
      })
      .catch(() => setMessage("Session check failed. Try signing in again."));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      generation++;
      setUser(s?.user.id ?? null);
      setPassword("");
    });
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
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = signup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: Linking.createURL("account") },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      setMessage(
        result.error?.message ??
          (signup
            ? "Check your email to confirm your account, then sign in."
            : "Signed in."),
      );
      if (!result.error) setPassword("");
    } catch {
      setMessage("Unable to connect. Your password was not saved in a draft.");
    } finally {
      setBusy(false);
    }
  }
  async function resetPassword() {
    if (!supabase || busy || !email.trim()) {
      setMessage("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: Linking.createURL("reset-password") },
      );
      setMessage(
        error
          ? "Could not request recovery. Try again later."
          : "If this account can receive recovery email, check your inbox for the reset link.",
      );
    } catch {
      setMessage("Unable to connect. Try again later.");
    } finally {
      setBusy(false);
    }
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
      style={{ flex: 1, backgroundColor: "#071719" }}
      contentContainerStyle={[
        styles.page,
        { flex: 0, flexGrow: 1, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Button label="← Back" onPress={() => router.back()} />
      <Text style={styles.heading}>INDRAYA</Text>
      <Text style={styles.text}>Together, we see the world.</Text>
      {!supabase ? (
        <Text style={styles.text}>
          Accounts are not available in this demo build. Your demo observations
          stay on this device.
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
            label={busy ? "Please wait…" : "Sign in"}
            disabled={busy}
            onPress={() => {
              void auth(false);
            }}
          />
          <Button
            label="Create account"
            disabled={busy}
            onPress={() => {
              void auth(true);
            }}
          />
        </>
      )}
      {!user && !!supabase && (
        <Button
          label="Forgot password"
          disabled={busy}
          onPress={() => {
            void resetPassword();
          }}
        />
      )}
      <Button label="Following places" onPress={() => router.push("/places")} />
      <Button
        label="My observations"
        onPress={() => router.push("/my-reports")}
      />
      <Button
        label="Moderator review"
        onPress={() => router.push("/moderation")}
      />
      <Text style={styles.text}>{message}</Text>
    </ScrollView>
  );
}
