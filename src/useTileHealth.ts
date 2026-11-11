import { useEffect, useState } from "react";
import { LogManager } from "@maplibre/maplibre-react-native";
import { isTileTransportFailure } from "./mapHealth";
const listeners = new Set<() => void>();
let failures = 0,
  lastLog = 0;
function handle(event: { message: string; level: string; tag: string }) {
  if (!isTileTransportFailure(event.message)) return false;
  failures++;
  listeners.forEach((listener) => listener());
  // Preserve the first full diagnostic, then emit a bounded summary during repeated transport failures.
  if (Date.now() - lastLog > 30000) {
    lastLog = Date.now();
    console.warn(
      `Map base-tile transport failures: ${failures}. Latest: ${event.message}`,
    );
    return false;
  }
  return true;
}
export default function useTileHealth() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const notify = () => setFailed(true);
    if (listeners.size === 0) LogManager.onLog(handle);
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
      if (listeners.size === 0) LogManager.onLog(() => false);
    };
  }, []);
  return [failed, setFailed] as const;
}
