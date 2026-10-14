import { z } from "zod";

export const FOCUS_STORAGE_KEY = "nudge:focus-timer";
export const PRESET_MINUTES = [5, 10, 20, 30] as const;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

const MINUTE_MS = 60_000;

// What lives in localStorage. No timer stored means the picker is showing.
// A running timer counts down to endsAt; a paused one keeps what is left in remainingMs
export const timerStateSchema = z.object({
  status: z.enum(["running", "paused", "finished"]),
  durationMs: z.number().int().positive(),
  endsAt: z.number().nullable(),
  remainingMs: z.number().min(0),
  habitId: z.string().min(1).optional(),
});

export type TimerState = z.infer<typeof timerStateSchema>;

// Whole minutes from the custom field, or null when empty, partial or out of range
export function parseCustomMinutes(input: string): number | null {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return null;
  const minutes = Number(text);
  return minutes >= MIN_MINUTES && minutes <= MAX_MINUTES ? minutes : null;
}

export function startTimer(minutes: number, now: number, habitId?: string): TimerState {
  const durationMs = minutes * MINUTE_MS;
  return {
    status: "running",
    durationMs,
    endsAt: now + durationMs,
    remainingMs: durationMs,
    ...(habitId ? { habitId } : {}),
  };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (timer.status !== "running" || timer.endsAt === null) return timer;
  return { ...timer, status: "paused", endsAt: null, remainingMs: Math.max(0, timer.endsAt - now) };
}

export function resumeTimer(timer: TimerState, now: number): TimerState {
  if (timer.status !== "paused") return timer;
  return { ...timer, status: "running", endsAt: now + timer.remainingMs };
}

// Keeps endsAt, which doubles as an id for the finished session
export function finishTimer(timer: TimerState): TimerState {
  return { ...timer, status: "finished", remainingMs: 0 };
}

// A running timer whose end time has passed counts as finished, even if nobody stored that yet
export function effectiveStatus(timer: TimerState, now: number): TimerState["status"] {
  if (timer.status === "running" && timer.endsAt !== null && timer.endsAt <= now) return "finished";
  return timer.status;
}

export function getRemainingMs(timer: TimerState, now: number): number {
  if (timer.status === "finished") return 0;
  if (timer.status === "paused" || timer.endsAt === null) return timer.remainingMs;
  return Math.max(0, timer.endsAt - now);
}

// "04:07" or "1:02:03"; rounds up so the clock never shows 00:00 before the end
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pair = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
}

// Anything missing or malformed counts as no timer
export function parseTimerState(raw: string | null): TimerState | null {
  if (!raw) return null;
  try {
    const result = timerStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
