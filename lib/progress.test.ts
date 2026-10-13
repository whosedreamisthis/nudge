import { describe, expect, it } from "vitest";
import { advanceAmount, advanceProgress, getTodayProgress } from "@/lib/progress";
import type { StreakTarget } from "@/lib/streaks";

// Tuesday 13 Oct 2026; its week starts on Monday the 12th
const TODAY = "2026-10-13";

const daily: StreakTarget = {
  frequency: "DAILY",
  targetDaysPerWeek: 7,
  effectiveFrom: "2026-09-14",
};
const weekly: StreakTarget = {
  frequency: "WEEKLY",
  targetDaysPerWeek: 3,
  effectiveFrom: "2026-09-14",
};

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

describe("advanceAmount", () => {
  it("completes a simple habit in one tap and clears it on the next", () => {
    expect(advanceAmount(0, null, null)).toBe(1);
    expect(advanceAmount(1, null, null)).toBe(0);
  });

  it("adds one step towards the goal, stopping at the goal", () => {
    expect(advanceAmount(0, 2000, 250)).toBe(250);
    expect(advanceAmount(1900, 2000, 250)).toBe(2000);
  });

  it("completes in one tap when there is no step size", () => {
    expect(advanceAmount(0, 20, null)).toBe(20);
  });

  it("clears a day that reached its goal", () => {
    expect(advanceAmount(2000, 2000, 250)).toBe(0);
  });
});

describe("advanceProgress", () => {
  const base = { amount: 0, goal: null, complete: false, week: null };

  it("completes a simple habit and undoes it again", () => {
    const done = advanceProgress(base, null);
    expect(done).toMatchObject({ complete: true, amount: 1 });
    expect(advanceProgress(done, null)).toEqual(base);
  });

  it("moves a goal habit one step without completing it", () => {
    expect(advanceProgress({ ...base, goal: 2000 }, 250)).toMatchObject({
      amount: 250,
      complete: false,
    });
  });

  it("completes on the final step", () => {
    expect(advanceProgress({ ...base, goal: 2000, amount: 1750 }, 250)).toMatchObject({
      amount: 2000,
      complete: true,
    });
  });

  it("moves the weekly count only when the day flips, never below zero", () => {
    const week = { done: 1, target: 3 };
    const open = { ...base, goal: 20, week };
    expect(advanceProgress(open, 5).week).toEqual(week);
    expect(advanceProgress({ ...open, amount: 15 }, 5).week).toEqual({ done: 2, target: 3 });
    expect(
      advanceProgress({ ...open, amount: 20, complete: true, week: { done: 0, target: 3 } }, 5)
        .week,
    ).toEqual({ done: 0, target: 3 });
  });
});
