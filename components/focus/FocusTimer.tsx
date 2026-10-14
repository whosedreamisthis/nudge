"use client";

import { Pause, Play, Square } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeHabitFromFocus } from "@/actions/habits";
import { useFocusTimer } from "@/components/focus/useFocusTimer";
import { Button } from "@/components/ui/button";
import {
  PRESET_MINUTES,
  formatClock,
  getRemainingMs,
  type HabitLink,
  parseCustomMinutes,
  pauseTimer,
  resumeTimer,
  startTimer,
} from "@/lib/focus";
import { prepareAlerts } from "@/lib/focus-alert";
import { currentTime, writeTimer } from "@/lib/focus-store";
import { cn } from "@/lib/utils";

const RING_RADIUS = 90;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const FIELD_CLASS =
  "w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface FocusTimerProps {
  // The habit from ?habit=, linked to any session started on this page
  habit: HabitLink | null;
  // From the TEMP_TIMER env var: adds a short timer for trying the finish
  testSeconds: number | null;
}

export function FocusTimer({ habit, testSeconds }: FocusTimerProps) {
  // Finishing (storing it, the chime, the toast) is handled app-wide by FocusWatcher
  const { loaded, timer, now, status } = useFocusTimer();

  const [custom, setCustom] = useState("");
  const customMinutes = parseCustomMinutes(custom);

  // On the finish card: count the session for its habit (on unless unticked)
  const [counting, setCounting] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start(minutes: number) {
    prepareAlerts();
    setCounting(true);
    writeTimer(startTimer(minutes, currentTime(), habit ?? undefined));
  }

  function finish() {
    if (!timer?.habitId || !counting) {
      writeTimer(null);
      return;
    }
    const { habitId, habitName } = timer;
    startTransition(async () => {
      const result = await completeHabitFromFocus({
        habitId,
        // At least a minute, so the short test timer still validates
        minutes: Math.max(1, Math.round(timer.durationMs / 60_000)),
      });
      if (result.success) {
        writeTimer(null);
        setCountError(null);
        toast.success(`Counted for ${habitName}`);
      } else {
        setCountError(result.error);
      }
    });
  }

  if (!loaded) {
    return <div className="h-72" aria-hidden />;
  }

  if (!timer || !status) {
    return (
      <section aria-label="Choose a duration" className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-border">
        {/* Only shown while picking: a running timer shows its own habit */}
        <p className="text-sm text-muted-foreground">
          {habit ? `Session for ${habit.habitName}. How long do you want to focus?` : "How long do you want to focus?"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {testSeconds && (
            <Button variant="outline" size="lg" onClick={() => start(testSeconds / 60)}>
              {testSeconds} sec
            </Button>
          )}
          {PRESET_MINUTES.map((minutes) => (
            <Button key={minutes} variant="outline" size="lg" onClick={() => start(minutes)}>
              {minutes} min
            </Button>
          ))}
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (customMinutes) start(customMinutes);
          }}
        >
          <label htmlFor="custom-minutes" className="text-sm text-muted-foreground">
            Custom
          </label>
          <input
            id="custom-minutes"
            inputMode="numeric"
            placeholder="Minutes"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className={FIELD_CLASS}
          />
          {/* Grows to the height of the field beside it */}
          <Button type="submit" size="lg" className="h-auto self-stretch" disabled={!customMinutes}>
            Start
          </Button>
        </form>
        {custom.trim() !== "" && !customMinutes && (
          <p className="-mt-3 text-xs text-destructive">Enter a whole number from 1 to 180.</p>
        )}
      </section>
    );
  }

  const remaining = status === "finished" ? 0 : getRemainingMs(timer, now);
  const progress = 1 - remaining / timer.durationMs;

  return (
    <section aria-label="Focus timer" className="flex flex-col items-center gap-6 rounded-xl bg-card p-6 ring-1 ring-border">
      <div className="relative size-56">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            // The clock ticks every 250ms; a slightly longer linear transition keeps the ring moving between ticks
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            role="timer"
            aria-live="off"
            className={cn("text-5xl font-semibold tabular-nums", status === "paused" && "text-muted-foreground")}
          >
            {formatClock(remaining)}
          </span>
          <span className="text-sm text-muted-foreground">
            {status === "finished" ? "Session complete" : status === "paused" ? "Paused" : "Focusing"}
          </span>
        </div>
      </div>

      {timer.habitName && <p className="text-sm text-muted-foreground">For {timer.habitName}</p>}

      {status === "finished" ? (
        <div className="flex flex-col items-center gap-3">
          {timer.habitId && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={counting}
                onChange={(event) => setCounting(event.target.checked)}
                className="size-4 accent-primary"
              />
              Count this session for {timer.habitName}
            </label>
          )}
          {countError && <p className="text-xs text-destructive">{countError}</p>}
          <Button size="lg" onClick={finish} disabled={pending}>
            {pending ? "Saving…" : "Done"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {status === "running" ? (
            <Button variant="outline" size="lg" onClick={() => writeTimer(pauseTimer(timer, currentTime()))}>
              <Pause data-icon="inline-start" /> Pause
            </Button>
          ) : (
            <Button size="lg" onClick={() => writeTimer(resumeTimer(timer, currentTime()))}>
              <Play data-icon="inline-start" /> Resume
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => writeTimer(null)}>
            <Square data-icon="inline-start" /> Stop
          </Button>
        </div>
      )}
    </section>
  );
}
