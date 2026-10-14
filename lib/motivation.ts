import { z } from "zod";
import { addDays, type DateKey } from "@/lib/dates";

// Pure helpers for the Morning Motivation card: the stored shape, the prompt and the history window.

// How many days before today the message looks at
export const HISTORY_DAYS = 14;

export const motivationSchema = z.object({
  message: z.string().trim().min(1).max(300),
  dismissed: z.boolean().default(false),
});

export type StoredMotivation = z.infer<typeof motivationSchema>;

// The JSON schema sent to Gemini (zod stays the real check on what comes back)
export const motivationResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string", description: "One warm, specific sentence of encouragement." },
  },
  required: ["message"],
};

// The model's answer: just the sentence
export const motivationReplySchema = motivationSchema.pick({ message: true });

export type HabitHistory = {
  name: string;
  // Completed days among the last HISTORY_DAYS days before today
  done: number;
};

// First day of the history window (today is not part of it)
export function historyStart(today: DateKey): DateKey {
  return addDays(today, -HISTORY_DAYS);
}

// Brand-new users, and anyone with nothing done in the window, get no card
export function hasHistory(habits: HabitHistory[]): boolean {
  return habits.some((habit) => habit.done > 0);
}

// Stand-in for Gemini when AI_DISABLED is set, built from the real habits
export function mockMotivation(habits: HabitHistory[]): { message: string } {
  const best = habits.reduce<HabitHistory | null>(
    (top, habit) => (!top || habit.done > top.done ? habit : top),
    null,
  );
  return {
    message: best
      ? `Mock motivation: you showed up for ${best.name} ${best.done} ${best.done === 1 ? "time" : "times"} lately, keep it going today.`
      : "Mock motivation: a small win this morning sets the tone for the day.",
  };
}

// Only habit names and how often they were done go in, nothing else about the user
export function buildMotivationPrompt(habits: HabitHistory[], today: DateKey): string {
  const lines = habits.map(
    (habit) => `- ${habit.name}: done ${habit.done} of the last ${HISTORY_DAYS} days`,
  );
  return [
    "You are a supportive habit coach writing the morning message for the user of a habit tracker.",
    `Today is ${today}. Below is how often each habit was done over the last ${HISTORY_DAYS} days, not counting today.`,
    "Write exactly one sentence, second person, warm and specific to this history. Mention a habit by name when it fits.",
    "Do not invent data, do not use emojis, and do not ask a question.",
    "",
    "Habits:",
    lines.join("\n"),
  ].join("\n");
}
