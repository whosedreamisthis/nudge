import { describe, expect, it } from "vitest";
import { getTodayStats, type StatsEntry } from "@/lib/stats";
import type { StreakTarget } from "@/lib/streaks";

// 2026-10-14 is a Wednesday
const today = "2026-10-14";
const daily = [
  {
    frequency: "DAILY" as const,
    targetDaysPerWeek: 7,
    effectiveFrom: "2026-01-05",
  },
];
const weekly = [
  {
    frequency: "WEEKLY" as const,
    targetDaysPerWeek: 2,
    effectiveFrom: "2026-01-05",
  },
];
const on = (...dates: string[]) => dates.map((date) => ({ date, amount: 1 }));

const entry = (
  name: string,
  icon: string,
  completions: string[],
  targets: StreakTarget[] = daily,
): StatsEntry => ({
  name,
  icon,
  history: { completions: on(...completions), dailyGoal: null, targets, today },
});

describe("getTodayStats", () => {
  it("is empty without habits", () => {
    expect(getTodayStats([])).toEqual({ activeStreaks: 0, bestStreak: null });
  });

  it("counts running streaks only", () => {
    const stats = getTodayStats([
      entry("Run", "🏃", ["2026-10-13", "2026-10-14"]),
      entry("Read", "📚", ["2026-10-01"]),
    ]);
    expect(stats.activeStreaks).toBe(1);
  });

  it("names the habit with the longest streak", () => {
    const stats = getTodayStats([
      entry("Run", "🏃", ["2026-10-12", "2026-10-13", "2026-10-14"]),
      entry("Read", "📚", ["2026-10-01"]),
    ]);
    expect(stats.bestStreak).toEqual({
      unit: "day",
      best: 3,
      name: "Run",
      icon: "🏃",
    });
  });

  it("compares weekly streaks as 7 days each", () => {
    const stats = getTodayStats([
      entry("Run", "🏃", ["2026-10-12", "2026-10-13", "2026-10-14"]),
      entry("Gym", "🏋️", ["2026-09-28", "2026-09-29", "2026-10-05", "2026-10-06"], weekly),
    ]);
    expect(stats.bestStreak).toMatchObject({
      unit: "week",
      best: 2,
      name: "Gym",
    });
  });
});
