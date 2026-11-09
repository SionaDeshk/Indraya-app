import { useEffect, useRef, useState } from "react";
import { supabase } from "./api";

// A mounted form belongs to its original actor, not the next signed-in account.
export default function useActorBoundary() {
  const original = useRef<string | null | undefined>(
    supabase ? undefined : "demo",
  );
  const invalid = useRef(false);
  const [actor, setActor] = useState(original.current);
  const [invalidated, setInvalidated] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const observe = (next: string | null) => {
      if (!active) return;
      if (original.current === undefined) {
        original.current = next;
        setActor(next);
      } else if (next !== original.current) {
        invalid.current = true;
        setInvalidated(true);
      }
    };
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      observe(session?.user.id ?? null),
    );
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (original.current === undefined)
          observe(data.session?.user.id ?? null);
      })
      .catch(() => {
        if (active) {
          invalid.current = true;
          setInvalidated(true);
        }
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return {
    actor,
    invalidated,
    current: () => !invalid.current && original.current !== undefined,
  };
}
