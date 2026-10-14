"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { advanceHabit } from "@/actions/habits";
import { CompletionRing } from "@/components/today/CompletionRing";
import { HabitRow } from "@/components/today/HabitRow";
import { advanceProgress } from "@/lib/progress";
import { getRingCounts, splitOffDay } from "@/lib/week-goal";
import type { TodayHabit } from "@/types/habits";

interface TodayHabitsProps {
  habits: TodayHabit[];
  // The page header; it sits beside the completion ring, which needs the optimistic state
  header: ReactNode;
  // Full width under the header (it should carry xl:col-span-2); may render nothing
  banner?: ReactNode;
  // Shown in the side column on large screens, and after the list on phones
  aside?: ReactNode;
  // Made-up habits are not in the database, so taps only change what is shown
  sample?: boolean;
}

export function TodayHabits({ habits, header, banner, aside, sample = false }: TodayHabitsProps) {
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

  const { done, total } = getRingCounts(shown);
  const { active, offDay } = splitOffDay(shown);

  // One flat keyed array, so a habit keeps its row (and its celebration) as it moves between groups
  const rows = [
    ...active.map((habit) => (
      <HabitRow
        key={habit.id}
        habit={habit}
        readOnly={sample}
        onError={setError}
        onTap={() => tap(habit.id)}
      />
    )),
    ...(offDay.length > 0
      ? [
          <li key="off-day-heading" className="mt-2">
            <h2 className="text-sm font-medium text-muted-foreground">Goal met this week</h2>
          </li>,
        ]
      : []),
    ...offDay.map((habit) => (
      <HabitRow
        key={habit.id}
        habit={habit}
        dimmed
        readOnly={sample}
        onError={setError}
        onTap={() => tap(habit.id)}
      />
    )),
  ];

  // On phones everything stacks in this order. From xl the list takes the left column and the
  // aside (the consistency card) the right one, under a full-width header.
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-x-8">
      <div className="flex items-start justify-between gap-4 xl:col-span-2">
        {header}
        <CompletionRing done={done} total={total} />
      </div>

      {banner}

      <div className="flex flex-col gap-3 xl:col-start-1">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <ul aria-label="Today's habits" className="flex flex-col gap-3">
          {rows}
        </ul>
      </div>

      {aside && <div className="xl:col-start-2">{aside}</div>}
    </div>
  );
}
