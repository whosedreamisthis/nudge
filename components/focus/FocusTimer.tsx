"use client";

import { Pause, Play, Square } from "lucide-react";
import { useState } from "react";
import { useFocusTimer } from "@/components/focus/useFocusTimer";
import { Button } from "@/components/ui/button";
import {
  PRESET_MINUTES,
  formatClock,
  getRemainingMs,
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

// testSeconds comes from the TEMP_TIMER env var and adds a short timer for trying the finish
export function FocusTimer({ testSeconds }: { testSeconds: number | null }) {
  // Finishing (storing it, the chime, the toast) is handled app-wide by FocusWatcher
  const { loaded, timer, now, status } = useFocusTimer();

  const [custom, setCustom] = useState("");
  const customMinutes = parseCustomMinutes(custom);

  function start(minutes: number) {
    prepareAlerts();
    writeTimer(startTimer(minutes, currentTime()));
  }

  if (!loaded) {
    return <div className="h-72" aria-hidden />;
  }

  if (!timer || !status) {
    return (
      <section aria-label="Choose a duration" className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-border">
        <p className="text-sm text-muted-foreground">How long do you want to focus?</p>
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
          <Button type="submit" size="lg" disabled={!customMinutes}>
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

      {status === "finished" ? (
        <Button size="lg" onClick={() => writeTimer(null)}>
          Done
        </Button>
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
