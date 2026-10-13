import type { TodayProgress } from "@/lib/progress";
import type { Streak } from "@/lib/streaks";

export const HABIT_COLORS = [
  "indigo",
  "sky",
  "emerald",
  "amber",
  "red",
  "pink",
  "violet",
  "teal",
  "lime",
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

// What a row on the Today page needs; built from a Habit with its category, targets and completions
export interface TodayHabit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  // Unit of a multi-step habit's goal ("ml", "min"), null for a simple check
  unit: string | null;
  categoryName: string;
  streak: Streak;
  progress: TodayProgress;
}
