"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { effectiveStatus, parseTimerState } from "@/lib/focus";
import { getNow, readTimerRaw, subscribeClock, subscribeTimer } from "@/lib/focus-store";

// The stored timer plus a ticking clock; shared by the Focus page and the app-wide watcher
export function useFocusTimer() {
  // undefined on the server and during hydration, so the first paint matches
  const raw = useSyncExternalStore(subscribeTimer, readTimerRaw, () => undefined);
  const timer = useMemo(() => (raw === undefined ? null : parseTimerState(raw)), [raw]);
  const endsAt = timer?.status === "running" ? timer.endsAt : null;

  const subscribe = useCallback((callback: () => void) => subscribeClock(callback, endsAt), [endsAt]);
  const now = useSyncExternalStore(subscribe, getNow, () => 0);

  const status = timer ? effectiveStatus(timer, now) : null;
  return { loaded: raw !== undefined, timer, now, status };
}
