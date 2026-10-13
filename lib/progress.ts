import { weekStart } from "@/lib/dates";
import {
  completedDays,
  completedInWeek,
  isDayComplete,
  targetForWeek,
  type StreakInput,
} from "@/lib/streaks";

export type TodayProgress = {
  // Total done today, in the habit's unit (1 for a simple check)
  amount: number;
  // The daily goal for a multi-step habit, null for a simple check
  goal: number | null;
  complete: boolean;
  // Weekly habits only: days completed so far this week against the target
  week: { done: number; target: number } | null;
};

export function getTodayProgress({
  completions,
  dailyGoal,
  targets,
  today,
}: StreakInput): TodayProgress {
  const amount = completions.filter((c) => c.date === today).reduce((sum, c) => sum + c.amount, 0);

  const target = targetForWeek(targets, weekStart(today));
  const week =
    target?.frequency === "WEEKLY"
      ? {
          done: completedInWeek(completedDays(completions, dailyGoal), today),
          target: target.targetDaysPerWeek,
        }
      : null;

  return { amount, goal: dailyGoal, complete: isDayComplete(amount, dailyGoal), week };
}

// The day's amount after one tap: a step towards the goal, or cleared (0) once the day is done.
// A simple habit (no goal) is done in one tap.
export function advanceAmount(amount: number, goal: number | null, stepSize: number | null) {
  if (isDayComplete(amount, goal)) return 0;
  if (goal === null) return 1;
  return Math.min(goal, amount + (stepSize ?? goal));
}

// Today's progress after a tap, for the optimistic update
export function advanceProgress(progress: TodayProgress, stepSize: number | null): TodayProgress {
  const amount = advanceAmount(progress.amount, progress.goal, stepSize);
  const complete = isDayComplete(amount, progress.goal);
  const change = complete === progress.complete ? 0 : complete ? 1 : -1;

  return {
    ...progress,
    amount,
    complete,
    week: progress.week
      ? { ...progress.week, done: Math.max(0, progress.week.done + change) }
      : null,
  };
}
