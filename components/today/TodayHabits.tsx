"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { advanceHabit } from "@/actions/habits";
import { CompletionRing } from "@/components/today/CompletionRing";
import { HabitRow } from "@/components/today/HabitRow";
import { StatTiles } from "@/components/today/StatTiles";
import { advanceProgress } from "@/lib/progress";
import type { TodayStats } from "@/lib/stats";
import type { TodayHabit } from "@/types/habits";

interface TodayHabitsProps {
  habits: TodayHabit[];
  stats: TodayStats;
  // The page header; it sits beside the completion ring, which needs the optimistic state
  header: ReactNode;
  // Made-up habits are not in the database, so taps only change what is shown
  sample?: boolean;
}

export function TodayHabits({ habits, stats, header, sample = false }: TodayHabitsProps) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState(habits);
  // Moves the tapped habit at once; it falls back to the server's data if the action fails
  const [optimistic, advance] = useOptimistic(habits, (current, habitId: string) =>
    current.map((habit) =>
      habit.id === habitId
        ? { ...habit, progress: advanceProgress(habit.progress, habit.stepSize) }
        : habit,
    ),
  );
  const shown = sample ? local : optimistic;

  function tap(habitId: string) {
    setError(null);
    if (sample) {
      setLocal((current) =>
        current.map((habit) =>
          habit.id === habitId
            ? { ...habit, progress: advanceProgress(habit.progress, habit.stepSize) }
            : habit,
        ),
      );
      return;
    }
    startTransition(async () => {
      advance(habitId);
      const result = await advanceHabit({ habitId });
      if (!result.success) setError(result.error);
    });
  }

  const done = shown.filter((habit) => habit.progress.complete).length;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        {header}
        <CompletionRing done={done} total={shown.length} />
      </div>

      <StatTiles stats={stats} />

      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul aria-label="Today's habits" className="flex flex-col gap-3">
        {shown.map((habit) => (
          <HabitRow key={habit.id} habit={habit} onTap={() => tap(habit.id)} />
        ))}
      </ul>
    </>
  );
}
