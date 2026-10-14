import { describe, expect, it } from "vitest";
import {
  REGENERATE_COOLDOWN_MS,
  buildWeeklyPrompt,
  cooldownSecondsLeft,
  reportSchema,
} from "./ai-report";
import type { GridRow } from "./week-grid";

const row: GridRow = {
  id: "h1",
  name: "Read",
  icon: "📚",
  color: "blue",
  days: [
    { date: "2026-10-12", state: "done" },
    { date: "2026-10-13", state: "open" },
    { date: "2026-10-14", state: "open" },
    { date: "2026-10-15", state: "future" },
    { date: "2026-10-16", state: "future" },
    { date: "2026-10-17", state: "future" },
    { date: "2026-10-18", state: "future" },
  ],
  done: 1,
  target: 5,
  met: false,
};

describe("reportSchema", () => {
  it("accepts a summary with exactly three insights", () => {
    expect(reportSchema.safeParse({ summary: "Good week", insights: ["a", "b", "c"] }).success).toBe(
      true,
    );
  });

  it("rejects the wrong number of insights or an empty summary", () => {
    expect(reportSchema.safeParse({ summary: "x", insights: ["a", "b"] }).success).toBe(false);
    expect(reportSchema.safeParse({ summary: " ", insights: ["a", "b", "c"] }).success).toBe(false);
  });
});

describe("cooldownSecondsLeft", () => {
  const generatedAt = new Date("2026-10-14T10:00:00Z");

  it("counts down from the cooldown", () => {
    expect(cooldownSecondsLeft(generatedAt, generatedAt)).toBe(REGENERATE_COOLDOWN_MS / 1000);
    expect(cooldownSecondsLeft(generatedAt, new Date("2026-10-14T10:04:30Z"))).toBe(30);
  });

  it("is 0 once the cooldown has passed", () => {
    expect(cooldownSecondsLeft(generatedAt, new Date("2026-10-14T10:05:00Z"))).toBe(0);
    expect(cooldownSecondsLeft(generatedAt, new Date("2026-10-15T10:00:00Z"))).toBe(0);
  });
});

describe("buildWeeklyPrompt", () => {
  it("includes the habits, their progress and the streaks", () => {
    const prompt = buildWeeklyPrompt(
      [row],
      { activeStreaks: 2, bestStreak: { unit: "day", best: 9 } },
      "2026-10-12",
      "2026-10-14",
    );

    expect(prompt).toContain("Read: 1 of 5 days");
    expect(prompt).toContain("10-12:done 10-13:missed");
    expect(prompt).toContain("10-15:n/a");
    expect(prompt).toContain("Running streaks: 2. Longest streak: 9 days.");
  });

  it("copes with no habits and no streak yet", () => {
    const prompt = buildWeeklyPrompt([], { activeStreaks: 0, bestStreak: null }, "2026-10-12", "2026-10-14");

    expect(prompt).toContain("(no habits)");
    expect(prompt).toContain("Longest streak: none yet.");
  });
});
