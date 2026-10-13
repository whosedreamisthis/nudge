import { z } from "zod";
import { HABIT_COLORS } from "@/types/habits";

// Emoji choices for the icon picker
export const HABIT_ICONS = [
  "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "📞", "✍️", "🎧",
  "🚶", "🚴", "🏊", "🍎", "☀️", "🧹", "💊", "🎨", "🎸", "🌱",
] as const;

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, "Give your habit a name").max(60, "Keep the name under 60 characters"),
  description: z.string().trim().max(200, "Keep the description under 200 characters"),
  categoryId: z.string().min(1, "Pick a category"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
  targetDaysPerWeek: z.number().int().min(1).max(7),
  // Catalog habits bring icons beyond the picker's choices
  icon: z.string().trim().min(1).max(16),
  color: z.enum(HABIT_COLORS),
  // Set when added from the catalog; the goal and unit are copied from it on the server
  systemHabitId: z.string().min(1).optional(),
});

export type CreateHabitInput = z.input<typeof createHabitSchema>;

// A daily habit means all seven days; a weekly habit needs fewer
export function isDailyTarget(frequency: "DAILY" | "WEEKLY", days: number) {
  return frequency === "DAILY" || days === 7;
}
