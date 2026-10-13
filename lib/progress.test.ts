import { describe, expect, it } from "vitest";
import { getTodayProgress } from "@/lib/progress";
import type { StreakTarget } from "@/lib/streaks";

// Tuesday 13 Oct 2026; its week starts on Monday the 12th
const TODAY = "2026-10-13";

const daily: StreakTarget = { frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: "2026-09-14" };
const weekly: StreakTarget = { frequency: "WEEKLY", targetDaysPerWeek: 3, effectiveFrom: "2026-09-14" };

const progress = (
  completions: { date: string; amount: number }[],
  dailyGoal: number | null = null,
  targets = [daily],
) => getTodayProgress({ completions, dailyGoal, targets, today: TODAY });

describe("getTodayProgress", () => {
  it("is not started with no completions today", () => {
    expect(progress([{ date: "2026-10-12", amount: 1 }])).toEqual({
      amount: 0,
      goal: null,
      complete: false,
      week: null,
    });
  });

  it("is complete once a simple habit is checked", () => {
    expect(progress([{ date: TODAY, amount: 1 }])).toMatchObject({ amount: 1, complete: true });
  });

  it("is in progress while a multi-step habit is under its goal", () => {
    expect(progress([{ date: TODAY, amount: 1500 }], 2000)).toEqual({
      amount: 1500,
      goal: 2000,
      complete: false,
      week: null,
    });
  });

  it("is complete when a multi-step goal is reached or passed", () => {
    expect(progress([{ date: TODAY, amount: 2000 }], 2000).complete).toBe(true);
    expect(progress([{ date: TODAY, amount: 2500 }], 2000).complete).toBe(true);
  });

  it("only looks at today's amount, not other days", () => {
    expect(progress([{ date: "2026-10-12", amount: 2000 }], 2000).amount).toBe(0);
  });

  it("counts this week's completed days for a weekly habit", () => {
    const completions = [
      { date: "2026-10-11", amount: 1 }, // last week's Sunday
      { date: "2026-10-12", amount: 1 },
      { date: TODAY, amount: 1 },
    ];
    expect(progress(completions, null, [weekly]).week).toEqual({ done: 2, target: 3 });
  });

  it("has no week progress for a daily habit", () => {
    expect(progress([{ date: TODAY, amount: 1 }]).week).toBeNull();
  });
});
