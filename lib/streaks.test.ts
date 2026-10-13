import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import {
  completedDays,
  getStreak,
  isDayComplete,
  isWeekComplete,
  targetForWeek,
  type Completion,
  type StreakTarget,
} from "@/lib/streaks";

// Tuesday 13 Oct 2026; its week starts on Monday the 12th
const TODAY = "2026-10-13";

const daily: StreakTarget = { frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: "2026-09-14" };
const weekly = (days: number, effectiveFrom = "2026-09-14"): StreakTarget => ({
  frequency: "WEEKLY",
  targetDaysPerWeek: days,
  effectiveFrom,
});

const done = (...days: string[]): Completion[] => days.map((date) => ({ date, amount: 1 }));
const run = (from: string, length: number) =>
  done(...Array.from({ length }, (_, i) => addDays(from, i)));
// `count` completions on the first days of the week that starts on `monday`
const week = (monday: string, count: number) => run(monday, count);

describe("isDayComplete", () => {
  it("needs one completion when there is no daily goal", () => {
    expect(isDayComplete(1, null)).toBe(true);
    expect(isDayComplete(0, null)).toBe(false);
  });

  it("needs the whole goal for multi-step habits", () => {
    expect(isDayComplete(2500, 3000)).toBe(false);
    expect(isDayComplete(3000, 3000)).toBe(true);
    expect(isDayComplete(3500, 3000)).toBe(true);
  });
});

describe("completedDays", () => {
  it("keeps only the days that reached the goal", () => {
    const days = completedDays(
      [
        { date: "2026-10-11", amount: 2 },
        { date: "2026-10-12", amount: 3 },
      ],
      3,
    );
    expect([...days]).toEqual(["2026-10-12"]);
  });
});

describe("targetForWeek", () => {
  const targets = [weekly(2, "2026-10-05"), weekly(3, "2026-09-14"), { ...daily, effectiveFrom: "2026-10-19" }];

  it("picks the newest target starting on or before the week, whatever the order", () => {
    expect(targetForWeek(targets, "2026-09-21")?.targetDaysPerWeek).toBe(3);
    expect(targetForWeek(targets, "2026-10-05")?.targetDaysPerWeek).toBe(2);
    expect(targetForWeek(targets, "2026-10-19")?.frequency).toBe("DAILY");
  });

  it("returns null before the first target", () => {
    expect(targetForWeek(targets, "2026-09-07")).toBeNull();
  });
});

describe("isWeekComplete", () => {
  const days = new Set(["2026-10-12", "2026-10-14", "2026-10-18"]);

  it("counts completed days Monday to Sunday against the target", () => {
    expect(isWeekComplete(days, "2026-10-15", 3)).toBe(true);
    expect(isWeekComplete(days, "2026-10-15", 4)).toBe(false);
  });

  it("does not count days from the neighbouring weeks", () => {
    expect(isWeekComplete(days, "2026-10-19", 1)).toBe(false);
  });
});

describe("getStreak: daily habits", () => {
  const streak = (completions: Completion[], extra = {}) =>
    getStreak({ completions, dailyGoal: null, targets: [daily], today: TODAY, ...extra });

  it("is zero with no completions", () => {
    expect(streak([])).toEqual({ unit: "day", current: 0, best: 0 });
  });

  it("counts consecutive days up to and including today", () => {
    expect(streak(done("2026-10-11", "2026-10-12", "2026-10-13"))).toEqual({
      unit: "day",
      current: 3,
      best: 3,
    });
  });

  it("keeps the streak alive while today is still open", () => {
    expect(streak(done("2026-10-10", "2026-10-11", "2026-10-12")).current).toBe(3);
  });

  it("resets after a missed day", () => {
    expect(streak(done("2026-10-10", "2026-10-11"))).toMatchObject({ current: 0, best: 2 });
  });

  it("remembers the best streak after the current one is shorter", () => {
    const completions = [...run("2026-10-01", 5), ...done("2026-10-12", "2026-10-13")];
    expect(streak(completions)).toMatchObject({ current: 2, best: 5 });
  });

  it("counts the longest run when the current run is the longest", () => {
    const completions = [...run("2026-10-01", 5), ...run("2026-10-08", 6)];
    expect(streak(completions)).toMatchObject({ current: 6, best: 6 });
  });

  it("only counts days where a multi-step goal was reached", () => {
    const completions = [
      { date: "2026-10-11", amount: 2 },
      { date: "2026-10-12", amount: 3 },
      { date: "2026-10-13", amount: 4 },
    ];
    expect(streak(completions, { dailyGoal: 3 })).toMatchObject({ current: 2, best: 2 });
  });

  it("ignores completions dated after today", () => {
    expect(streak(done("2026-10-12", "2026-10-13", "2026-10-14"))).toMatchObject({
      current: 2,
      best: 2,
    });
  });

  it("runs across month and year boundaries", () => {
    const completions = done("2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02");
    expect(streak(completions, { today: "2027-01-02" })).toMatchObject({ current: 4, best: 4 });
  });

  it("treats a habit with no targets as daily", () => {
    expect(streak(done("2026-10-13"), { targets: [] })).toMatchObject({ unit: "day", current: 1 });
  });
});

describe("getStreak: weekly habits", () => {
  const streak = (completions: Completion[], targets = [weekly(3)], today = TODAY) =>
    getStreak({ completions, dailyGoal: null, targets, today });

  const fullWeeks = [
    ...week("2026-09-14", 3),
    ...week("2026-09-21", 3),
    ...week("2026-09-28", 3),
    ...week("2026-10-05", 3),
  ];

  it("counts weeks where completions reached the target", () => {
    expect(streak(fullWeeks)).toEqual({ unit: "week", current: 4, best: 4 });
  });

  it("does not count the current week as a miss while it is unfinished", () => {
    expect(streak([...fullWeeks, ...week("2026-10-12", 1)])).toMatchObject({ current: 4 });
  });

  it("adds the current week once it reaches the target", () => {
    expect(streak([...fullWeeks, ...week("2026-10-12", 3)])).toMatchObject({ current: 5, best: 5 });
  });

  it("counts a week once however many extra days were done", () => {
    expect(streak(week("2026-10-05", 6))).toMatchObject({ current: 1 });
  });

  it("resets after a past week that fell short", () => {
    const completions = [
      ...week("2026-09-14", 3),
      ...week("2026-09-21", 3),
      ...week("2026-09-28", 3),
      ...week("2026-10-05", 2),
      ...week("2026-10-12", 3),
    ];
    expect(streak(completions)).toMatchObject({ current: 1, best: 3 });
  });

  it("starts a new week open on Monday", () => {
    expect(streak(fullWeeks, [weekly(3)], "2026-10-12")).toMatchObject({ current: 4 });
  });

  it("judges each past week by the target in effect then", () => {
    // 2 days a week until 5 Oct, then 3 days a week
    const targets = [weekly(2, "2026-09-14"), weekly(3, "2026-10-05")];
    const completions = [
      ...week("2026-09-14", 2),
      ...week("2026-09-21", 2),
      ...week("2026-09-28", 2),
      ...week("2026-10-05", 2),
      ...week("2026-10-12", 3),
    ];
    expect(streak(completions, targets)).toMatchObject({ current: 1, best: 3 });
  });

  it("does not count weeks before the habit's first target", () => {
    const targets = [weekly(3, "2026-10-05")];
    const completions = [...week("2026-09-28", 3), ...week("2026-10-05", 3), ...week("2026-10-12", 3)];
    expect(streak(completions, targets)).toMatchObject({ current: 2, best: 2 });
  });

  it("runs across the year boundary", () => {
    const targets = [weekly(3, "2026-12-14")];
    const completions = [...week("2026-12-21", 3), ...week("2026-12-28", 3)];
    expect(streak(completions, targets, "2027-01-04")).toMatchObject({ current: 2, best: 2 });
  });

  it("falls back to a day streak when there are no targets", () => {
    expect(streak(fullWeeks, [])).toMatchObject({ unit: "day", current: 0 });
  });

  it("switches to a day streak when the habit became daily", () => {
    const targets = [weekly(3, "2026-09-14"), { ...daily, effectiveFrom: "2026-10-05" }];
    const completions = done("2026-10-11", "2026-10-12", "2026-10-13");
    expect(streak(completions, targets)).toEqual({ unit: "day", current: 3, best: 3 });
  });
});
