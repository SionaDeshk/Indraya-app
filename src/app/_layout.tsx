import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { supabase } from "../api";
import { ClockProvider } from "../Clock";
import { Stack } from "expo-router";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
});
export default function Layout() {
  useEffect(() => {
    if (Platform.OS !== "web")
      focusManager.setFocused(AppState.currentState === "active");
    const focusListener =
      Platform.OS !== "web"
        ? AppState.addEventListener("change", (state) =>
            focusManager.setFocused(state === "active"),
          )
        : null;
    if (!supabase) return () => focusListener?.remove();
    let actor: string | null | undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id ?? null;
      if (actor !== undefined && actor !== next) {
        void client.cancelQueries({ queryKey: ["report-photo"] });
        void client.cancelQueries({ queryKey: ["private"] });
        void client.cancelQueries({ queryKey: ["staff"] });
        client.removeQueries({ queryKey: ["report-photo"] });
        client.removeQueries({ queryKey: ["private"] });
        client.removeQueries({ queryKey: ["staff"] });
        setTimeout(() => {
          void client.resetQueries({ queryKey: ["report-photo"] });
          void client.resetQueries({ queryKey: ["private"] });
          void client.resetQueries({ queryKey: ["staff"] });
          void client.resetQueries({ queryKey: ["review-queue"] });
          void client.invalidateQueries({ queryKey: ["observations"] });
          void client.invalidateQueries({ queryKey: ["nearby-observations"] });
        }, 0);
      }
      actor = next;
    });
    const listener =
      Platform.OS !== "web"
        ? AppState.addEventListener("change", (state) => {
            if (state === "active") supabase?.auth.startAutoRefresh();
            else supabase?.auth.stopAutoRefresh();
          })
        : null;
    if (Platform.OS !== "web" && AppState.currentState === "active")
      supabase.auth.startAutoRefresh();
    return () => {
      data.subscription.unsubscribe();
      listener?.remove();
      focusListener?.remove();
      if (Platform.OS !== "web") supabase?.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <QueryClientProvider client={client}>
      <ClockProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#071719" },
          }}
        />
      </ClockProvider>
    </QueryClientProvider>
  );
}
