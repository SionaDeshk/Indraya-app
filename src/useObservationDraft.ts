import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./api";
import { validPath, publicLocation } from "./taxonomy";
import { ObservationDraft, parseDraft } from "./observationDraft";
export default function useObservationDraft(
  value: ObservationDraft,
  complete: boolean,
) {
  const [key, setKey] = useState<string | null>(null),
    [pending, setPending] = useState<ObservationDraft | null>(null),
    [error, setError] = useState("");
  const stopped = useRef(false);
  const startedAt = useRef(new Date().toISOString());
  useEffect(() => {
    let active = true;
    let known: string | undefined;
    let unsubscribe: (() => void) | undefined;
    const load = async (user?: string) => {
      const next = `indraya.draft.v1.${user ?? "demo"}`;
      setKey(null);
      try {
        const raw = await AsyncStorage.getItem(next);
        const draft = parseDraft(raw);
        if (raw && !draft) await AsyncStorage.removeItem(next);
        if (active && !stopped.current) {
          setPending(draft);
          setKey(next);
        }
      } catch {
        if (active)
          setError(
            "Draft recovery is unavailable on this device. Keep this screen open until you finish.",
          );
      }
    };
    if (!supabase) void load();
    else {
      void supabase.auth.getSession().then(({ data }) => {
        known = data.session?.user.id ?? "signed-out";
        return load(known);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const actor = session?.user.id ?? "signed-out";
        if (known !== undefined && known !== actor) {
          stopped.current = true;
          setKey(null);
          setPending(null);
          setError(
            "Account changed. Draft autosave is paused; reopen sharing to recover this account's draft.",
          );
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  const stored = JSON.stringify({
    version: 1,
    updatedAt: Date.now(),
    value: {
      ...value,
      observedAt: value.observedAt ?? startedAt.current,
      location:
        value.location && validPath(value.selection)
          ? publicLocation(value.selection, value.answers, {
              ...value.location,
              name: value.location.privateAddress
                ? "Approximate map area"
                : value.location.name,
            })
          : null,
    },
  });
  const latest = useRef<string | null>(null);
  if (validPath(value.selection)) latest.current = stored;
  useEffect(() => {
    if (!key || pending || stopped.current) return;
    if (complete) {
      stopped.current = true;
      void AsyncStorage.removeItem(key);
      return;
    }
    if (validPath(value.selection))
      void AsyncStorage.setItem(key, stored).catch(() =>
        setError(
          "Could not save this draft locally. Keep the screen open until you finish.",
        ),
      );
  }, [key, pending, complete, stored, value.selection]);
  useEffect(
    () => () => {
      if (key && !stopped.current && !pending && latest.current)
        void AsyncStorage.setItem(key, latest.current).catch(() => undefined);
    },
    [key, pending],
  );
  return {
    pending,
    error,
    accept: () => setPending(null),
    discard: async () => {
      try {
        if (key) await AsyncStorage.removeItem(key);
        setPending(null);
      } catch {
        setError("Could not discard the draft. Try again before sharing.");
      }
    },
    clear: async () => {
      stopped.current = true;
      try {
        if (key) await AsyncStorage.removeItem(key);
      } catch {
        setError(
          "Observation saved, but the local draft could not be removed. Discard it before sharing again.",
        );
      }
    },
  };
}
