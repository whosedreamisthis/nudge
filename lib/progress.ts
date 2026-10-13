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
  const amount = completions
    .filter((c) => c.date === today)
    .reduce((sum, c) => sum + c.amount, 0);

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
