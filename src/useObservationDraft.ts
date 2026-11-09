import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useActorBoundary from "./useActorBoundary";
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
  const frozen = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const enqueue = (task: () => Promise<void>) => {
    const next = writes.current.catch(() => undefined).then(task);
    writes.current = next;
    return next;
  };
  const startedAt = useRef(new Date().toISOString());
  const boundary = useActorBoundary();
  if (boundary.invalidated) stopped.current = true;
  useEffect(() => {
    let active = true;
    setKey(null);
    if (boundary.actor === undefined || boundary.invalidated) {
      setPending(null);
      return;
    }
    const next = `indraya.draft.v1.${boundary.actor ?? "signed-out"}`;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(next);
        const draft = parseDraft(raw);
        if (raw && !draft) await AsyncStorage.removeItem(next);
        if (active && !stopped.current && boundary.current()) {
          frozen.current = !!draft?.attempt;
          setPending(draft);
          setKey(next);
        }
      } catch {
        if (active)
          setError(
            "Draft storage is unavailable. Free device storage or reopen sharing before saving.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [boundary.actor, boundary.invalidated]);
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
  if (validPath(value.selection) && !frozen.current) latest.current = stored;
  useEffect(() => {
    if (!key || pending || stopped.current || frozen.current) return;
    if (complete) {
      stopped.current = true;
      void enqueue(() => AsyncStorage.removeItem(key));
      return;
    }
    if (validPath(value.selection))
      void enqueue(() => AsyncStorage.setItem(key, stored)).catch(() =>
        setError(
          "Could not save this draft locally. Keep the screen open until you finish.",
        ),
      );
  }, [key, pending, complete, stored, value.selection]);
  useEffect(
    () => () => {
      if (key && !stopped.current && !pending && latest.current)
        void enqueue(() => AsyncStorage.setItem(key, latest.current!)).catch(
          () => undefined,
        );
    },
    [key, pending],
  );
  return {
    boundary,
    ready: key !== null && !boundary.invalidated,
    pending,
    error,
    persistAttempt: async (snapshot: ObservationDraft) => {
      if (!key || !boundary.current() || boundary.invalidated)
        throw Error("Account changed. Reopen sharing.");
      frozen.current = true;
      const serialized = JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        value: snapshot,
      });
      latest.current = serialized;
      await enqueue(() => AsyncStorage.setItem(key, serialized));
      if (!boundary.current()) throw Error("Account changed. Reopen sharing.");
    },
    accept: () => setPending(null),
    discard: async () => {
      try {
        if (key) await enqueue(() => AsyncStorage.removeItem(key));
        frozen.current = false;
        setPending(null);
      } catch {
        setError("Could not discard the draft. Try again before sharing.");
      }
    },
    clear: async () => {
      stopped.current = true;
      try {
        if (key) await enqueue(() => AsyncStorage.removeItem(key));
      } catch {
        setError(
          "Observation saved, but the local draft could not be removed. Discard it before sharing again.",
        );
      }
    },
  };
}
