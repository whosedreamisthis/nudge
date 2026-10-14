import { z } from "zod";
import { HABIT_COLORS } from "@/types/habits";

// Emoji choices for the icon picker
export const HABIT_ICONS = [
  "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "📞", "✍️", "🎧",
  "🚶", "🚴", "🏊", "🍎", "☀️", "🧹", "💊", "🎨", "🎸", "🌱",
] as const;

const MAX_AMOUNT = 100000;

const habitFields = {
  name: z
    .string()
    .trim()
    .min(1, "Give your habit a name")
    .max(60, "Keep the name under 60 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Keep the description under 200 characters"),
  categoryId: z.string().min(1, "Pick a category"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
  targetDaysPerWeek: z.number().int().min(1).max(7),
  // Catalog habits bring icons beyond the picker's choices
  icon: z.string().trim().min(1).max(16),
  color: z.enum(HABIT_COLORS),
  // Optional daily goal: a habit done in steps, like 8 glasses or 3 times. Empty means a plain check.
  dailyGoal: z
    .number()
    .int()
    .min(2, "A goal of 1 is a plain check, leave it empty")
    .max(MAX_AMOUNT)
    .nullish(),
  unit: z
    .string()
    .trim()
    .max(12, "Keep the unit under 12 characters")
    .nullish(),
  stepSize: z
    .number()
    .int()
    .min(1, "The step must be at least 1")
    .max(MAX_AMOUNT)
    .nullish(),
};

interface GoalFields {
  dailyGoal?: number | null;
  unit?: string | null;
  stepSize?: number | null;
}

// A goal needs a unit and a step that fits inside it
function checkGoal(value: GoalFields, ctx: z.RefinementCtx) {
  if (value.dailyGoal == null) return;
  if (!value.unit) {
    ctx.addIssue({
      code: "custom",
      path: ["unit"],
      message: "Add a unit for the goal, like ml or times",
    });
  }
  if (value.stepSize == null || value.stepSize > value.dailyGoal) {
    ctx.addIssue({
      code: "custom",
      path: ["stepSize"],
      message: "The step must be between 1 and the goal",
    });
  }
}

export const createHabitSchema = z
  .object({
    ...habitFields,
    // Set when added from the catalog
    systemHabitId: z.string().min(1).optional(),
  })
  .superRefine(checkGoal);

export type CreateHabitInput = z.input<typeof createHabitSchema>;

// Editing sends the same fields; the link to a system habit never changes
export const updateHabitSchema = z
  .object({ ...habitFields, habitId: z.string().min(1) })
  .superRefine(checkGoal);

export type UpdateHabitInput = z.input<typeof updateHabitSchema>;

// What gets stored: all three together, or all null for a plain check
export function goalData({ dailyGoal, unit, stepSize }: GoalFields) {
  if (dailyGoal == null) return { dailyGoal: null, unit: null, stepSize: null };
  return { dailyGoal, unit: unit ?? null, stepSize: stepSize ?? null };
}

export const setAmountSchema = z.object({
  habitId: z.string().min(1),
  amount: z
    .number()
    .int()
    .min(0, "Enter 0 or more")
    .max(1000000, "That is too much"),
});

// A daily habit means all seven days; a weekly habit needs fewer
export function isDailyTarget(frequency: "DAILY" | "WEEKLY", days: number) {
  return frequency === "DAILY" || days === 7;
}
