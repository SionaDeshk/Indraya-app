import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { supabase } from "../api";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
});
export default function Layout() {
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setTimeout(() => {
          void client.resetQueries({ queryKey: ["report-photo"] });
          void client.invalidateQueries({ queryKey: ["observations"] });
          void client.invalidateQueries({ queryKey: ["nearby-observations"] });
        }, 0);
      }
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
      if (Platform.OS !== "web") supabase?.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <QueryClientProvider client={client}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#071719" },
        }}
      />
    </QueryClientProvider>
  );
}
