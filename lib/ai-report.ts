import { z } from "zod";
import { weekRangeLabel, type GridRow } from "@/lib/week-grid";
import type { DateKey } from "@/lib/dates";

// Pure helpers for the weekly AI report: the stored shape, the prompt and the regenerate limit.

export const reportSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  insights: z.array(z.string().trim().min(1).max(400)).length(3),
});

export type WeeklyReport = z.infer<typeof reportSchema>;

// The JSON schema sent to Gemini (zod stays the real check on what comes back)
export const reportResponseSchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "A short, warm narrative of the week, 2-4 sentences." },
    insights: {
      type: "array",
      items: { type: "string" },
      description: "Exactly 3 specific, actionable insights, one sentence each.",
    },
  },
  required: ["summary", "insights"],
  propertyOrdering: ["summary", "insights"],
};

// A regenerated report must be at least this old, so the button can't be hammered
export const REGENERATE_COOLDOWN_MS = 5 * 60 * 1000;

// Seconds left before a report generated at `generatedAt` may be regenerated; 0 when allowed
export function cooldownSecondsLeft(generatedAt: Date, now: Date = new Date()): number {
  const left = REGENERATE_COOLDOWN_MS - (now.getTime() - generatedAt.getTime());
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

// Stand-in for Gemini when AI_DISABLED is set, built from the real habits so the card looks right
export function mockWeeklyReport(rows: GridRow[]): WeeklyReport {
  const done = rows.reduce((sum, row) => sum + row.done, 0);
  const best = rows.reduce<GridRow | null>((top, row) => (!top || row.done > top.done ? row : top), null);
  return {
    summary: `Mock report: you completed ${done} habit ${done === 1 ? "day" : "days"} across ${rows.length} ${rows.length === 1 ? "habit" : "habits"} this week.`,
    insights: [
      best ? `Mock insight: ${best.name} is your strongest habit this week.` : "Mock insight: add a habit to get started.",
      "Mock insight: pick one habit to protect on your busiest day.",
      "Mock insight: a small win each morning keeps a streak alive.",
    ],
  };
}

export type PromptStats = {
  activeStreaks: number;
  bestStreak: { unit: "day" | "week"; best: number } | null;
};

// Only this week's completions, targets and streaks go in, nothing else about the user
export function buildWeeklyPrompt(
  rows: GridRow[],
  stats: PromptStats,
  week: DateKey,
  today: DateKey,
): string {
  const habits = rows.length
    ? rows
        .map((row) => {
          const days = row.days
            .map((d) => `${d.date.slice(5)}:${d.state === "done" ? "done" : d.state === "open" ? "missed" : "n/a"}`)
            .join(" ");
          return `- ${row.name}: ${row.done} of ${row.target} days (${days})`;
        })
        .join("\n")
    : "(no habits)";

  return [
    "You are a supportive habit coach writing a weekly report for the user of a habit tracker.",
    `The week is ${weekRangeLabel(week)}; today is ${today}, so days after today have not happened yet.`,
    "Write a short narrative summary (2-4 sentences, second person) and exactly 3 specific, actionable insights, one sentence each.",
    "Be encouraging and honest, mention habits by name, and do not invent data.",
    "",
    `Running streaks: ${stats.activeStreaks}. Longest streak: ${stats.bestStreak ? `${stats.bestStreak.best} ${stats.bestStreak.unit}s` : "none yet"}.`,
    "Habits this week (done days against the weekly target; per-day state):",
    habits,
  ].join("\n");
}
