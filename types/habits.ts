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
  // How much one tap adds to a multi-step habit, null when a tap completes it
  stepSize: number | null;
  categoryName: string;
  categoryId: string;
  // No system habit behind it: only these can be deleted
  isCustom: boolean;
  // The target in force this week, for the edit form
  frequency: "DAILY" | "WEEKLY";
  targetDaysPerWeek: number;
  streak: Streak;
  progress: TodayProgress;
}
