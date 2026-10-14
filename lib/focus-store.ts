import { FOCUS_STORAGE_KEY, type TimerState } from "@/lib/focus";

// Browser-only helpers behind useSyncExternalStore: the timer in localStorage and a clock

const listeners = new Set<() => void>();
// Kept so the timer still works when storage is blocked (private windows)
let memory: string | null = null;

export function subscribeTimer(callback: () => void) {
  listeners.add(callback);
  // Another tab changed the timer
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function readTimerRaw(): string | null {
  try {
    return localStorage.getItem(FOCUS_STORAGE_KEY);
  } catch {
    return memory;
  }
}

export function writeTimer(timer: TimerState | null) {
  memory = timer ? JSON.stringify(timer) : null;
  try {
    if (memory) localStorage.setItem(FOCUS_STORAGE_KEY, memory);
    else localStorage.removeItem(FOCUS_STORAGE_KEY);
  } catch {
    // Storage is blocked; the in-memory copy covers this tab
  }
  listeners.forEach((listener) => listener());
}

let now = Date.now();

export function getNow() {
  return now;
}

// The real time, for click handlers (getNow lags by up to a tick)
export function currentTime() {
  return Date.now();
}

// Ticks while subscribed, and once more at endsAt in case the tab's interval is throttled
export function subscribeClock(callback: () => void, endsAt: number | null = null) {
  const tick = () => {
    now = Date.now();
    callback();
  };
  tick();
  const interval = setInterval(tick, 250);
  const endTimeout = endsAt === null ? null : setTimeout(tick, Math.max(0, endsAt - Date.now()));
  return () => {
    clearInterval(interval);
    if (endTimeout !== null) clearTimeout(endTimeout);
  };
}
