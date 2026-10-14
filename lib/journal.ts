import { z } from "zod";

export const MAX_ENTRY_LENGTH = 20000;

// Mood 1 (rough) to 5 (great); the picker shows these
export const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

export const saveEntrySchema = z.object({
  content: z.string().max(MAX_ENTRY_LENGTH, "That entry is too long"),
  mood: z.number().int().min(1).max(5).nullable(),
});

export type SaveEntryInput = z.input<typeof saveEntrySchema>;
