"use client";

import { Check, Flame } from "lucide-react";
import { useState } from "react";
import { HabitMenu } from "@/components/today/HabitMenu";
import { categoryTagClass, habitFillClass, habitTileClass } from "@/lib/habit-colors";
import { describeStreak, formatStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import type { TodayHabit } from "@/types/habits";

interface HabitRowProps {
  habit: TodayHabit;
  onTap: () => void;
}

const BURST_COLORS = ["bg-habit-amber", "bg-cat-fitness", "bg-habit-sky", "bg-complete"];
const BURST_DOTS = 8;
// The burst starts 100ms before the card fill (duration-400) reaches the end
const BURST_DELAY_MS = 300;

// Dots flying out of the completion circle, which sits 28px in from the card's top-right corner
function Celebration() {
  return (
    <span
      aria-hidden
      className="celebrate-burst pointer-events-none absolute top-3 right-3 z-10 size-8"
    >
      <span
        className="absolute inset-0 rounded-full border-2 border-complete opacity-0"
        style={{ animation: `celebrate-ring 500ms ease-out ${BURST_DELAY_MS}ms forwards` }}
      />
      {Array.from({ length: BURST_DOTS }, (_, i) => (
        <span
          key={i}
          className={cn(
            "absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full opacity-0",
            BURST_COLORS[i % BURST_COLORS.length],
          )}
          style={
            {
              "--angle": `${(360 / BURST_DOTS) * i}deg`,
              transformOrigin: "center",
              animation: `celebrate-dot 550ms ease-out ${BURST_DELAY_MS}ms forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function HabitRow({ habit, onTap }: HabitRowProps) {
  const { streak, progress } = habit;
  // Replays the burst each time the habit goes from not done to done (state adjusted during render)
  const [wasComplete, setWasComplete] = useState(progress.complete);
  const [bursts, setBursts] = useState(0);
  if (wasComplete !== progress.complete) {
    setWasComplete(progress.complete);
    if (progress.complete) setBursts((count) => count + 1);
  }
  const hasStreak = streak.current > 0;
  const isMultiStep = progress.goal !== null;
  // A simple habit is a one-step goal, so its card fills from empty to full in one tap
  const fillPercent = Math.min(100, (progress.amount / (progress.goal ?? 1)) * 100);

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-xl p-3 text-card-foreground shadow-sm ring-1",
        "bg-card",
        progress.complete ? "ring-complete/30" : "ring-border",
      )}
    >
      {/* The whole card is the progress bar: a tint that grows from the left with the amount done */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <div
          className={cn(
            "h-full transition-[width] duration-400 ease-out",
            habitFillClass(habit.color),
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {bursts > 0 && <Celebration key={bursts} />}
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-xl",
          habitTileClass(habit.color),
        )}
      >
        {habit.icon}
      </span>

      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{habit.name}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs",
              categoryTagClass(habit.categoryName),
            )}
          >
            {habit.categoryName}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>

        {isMultiStep && (
          <p
            role="progressbar"
            aria-label={`${habit.name} progress`}
            aria-valuemin={0}
            aria-valuemax={progress.goal!}
            aria-valuenow={Math.min(progress.amount, progress.goal!)}
            className="mt-1 text-xs text-muted-foreground tabular-nums"
          >
            {progress.amount}/{progress.goal} {habit.unit}
          </p>
        )}

        {progress.week && (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {progress.week.done}/{progress.week.target} this week
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
        <div className="flex items-center gap-3">
          <span
            aria-label={describeStreak(streak)}
            className={cn(
              "flex shrink-0 items-center gap-1 text-sm font-medium",
              !hasStreak && "text-muted-foreground",
            )}
          >
            <Flame aria-hidden className={cn("size-4", hasStreak && "text-cat-fitness")} />
            {formatStreak(streak)}
          </span>

          {/* Its ::after stretches over the whole card, so a tap anywhere on the card lands here */}
          <button
            type="button"
            onClick={onTap}
            aria-pressed={isMultiStep ? undefined : progress.complete}
            aria-label={
              progress.complete
                ? `Mark ${habit.name} as not done`
                : isMultiStep
                  ? `Add progress to ${habit.name}`
                  : `Mark ${habit.name} as done`
            }
            className={cn(
              "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 outline-none transition-colors duration-300 after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring",
              progress.complete
                ? "border-complete bg-complete text-complete-foreground"
                : "border-muted-foreground/40 group-hover:border-complete",
            )}
          >
            {progress.complete && <Check aria-hidden className="size-4" strokeWidth={3} />}
          </button>
        </div>

        {/* Above the card-wide tap target */}
        <div className="relative z-10">
          <HabitMenu habitName={habit.name} />
        </div>
      </div>
    </li>
  );
}
