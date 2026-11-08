import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
const Clock = createContext(Date.now());
export function ClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 30000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}
export function useNow() {
  return useContext(Clock);
}
