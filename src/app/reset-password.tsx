import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../api";
import { Button, styles } from "../ui";
export default function ResetPassword() {
  const recovery = useRef<{ code: string; promise: Promise<boolean> } | null>(
    null,
  );
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [ready, setReady] = useState(false),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("Checking your recovery link…");
  useEffect(() => {
    let active = true;
    async function recover() {
      if (!supabase || !code) {
        if (active)
          setMessage(
            "Open the recovery link from your email on the device that requested it.",
          );
        return;
      }
      const client = supabase;
      if (!recovery.current || recovery.current.code !== code) {
        recovery.current = {
          code,
          promise: (async () => {
            const { error } = await client.auth.exchangeCodeForSession(code);
            if (error) return false;
            const { data } = await client.auth.getUser();
            return !!data.user;
          })().catch(() => false),
        };
      }
      const ok = await recovery.current.promise;
      if (active) {
        setReady(ok);
        setMessage(
          ok
            ? "Choose a new password."
            : "This recovery link is invalid or expired. Request a new one from Account on this device.",
        );
      }
    }
    void recover();
    return () => {
      active = false;
    };
  }, [code]);
  async function save() {
    if (!supabase || busy) return;
    if (password.length < 8 || password !== confirm) {
      setMessage("Use at least 8 characters and match both passwords.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setReady(false);
      setPassword("");
      setConfirm("");
      setMessage("Password updated. You can return to Account.");
    } catch {
      setMessage(
        "Could not update your password. Retry or request a new recovery link.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text accessibilityRole="header" style={styles.heading}>
        Reset password
      </Text>
      <Text accessibilityRole="alert" style={styles.text}>
        {message}
      </Text>
      {ready && (
        <>
          <TextInput
            accessibilityLabel="New password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Confirm password"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            style={styles.input}
          />
          <Button
            label={busy ? "Updating…" : "Update password"}
            disabled={busy}
            onPress={() => {
              void save();
            }}
          />
        </>
      )}
      <Button
        label="Back to Account"
        onPress={() => router.replace("/account")}
      />
    </ScrollView>
  );
}
