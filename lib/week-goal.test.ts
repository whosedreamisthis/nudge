import { describe, expect, it } from "vitest";
import type { TodayProgress } from "@/lib/progress";
import { getRingCounts, isOffDay, isWeekGoalMet, splitOffDay } from "@/lib/week-goal";
import type { TodayHabit } from "@/types/habits";

const daily = (complete: boolean): TodayProgress => ({
  amount: complete ? 1 : 0,
  goal: null,
  complete,
  week: null,
});

const weekly = (done: number, target: number, complete = false): TodayProgress => ({
  amount: complete ? 1 : 0,
  goal: null,
  complete,
  week: { done, target },
});

const habit = (id: string, progress: TodayProgress) => ({ id, progress }) as TodayHabit;

describe("isWeekGoalMet", () => {
  it("is false for daily habits and weekly habits short of target", () => {
    expect(isWeekGoalMet(daily(true))).toBe(false);
    expect(isWeekGoalMet(weekly(2, 3))).toBe(false);
  });

  it("is true at or past the target", () => {
    expect(isWeekGoalMet(weekly(3, 3))).toBe(true);
    expect(isWeekGoalMet(weekly(4, 3))).toBe(true);
  });
});

describe("isOffDay", () => {
  it("dims a weekly habit whose goal was met earlier in the week", () => {
    expect(isOffDay(weekly(3, 3))).toBe(true);
  });

  it("keeps it in the main list once it is done today, even if today met the goal", () => {
    expect(isOffDay(weekly(3, 3, true))).toBe(false);
  });

  it("never applies to daily habits or weekly habits still short", () => {
    expect(isOffDay(daily(false))).toBe(false);
    expect(isOffDay(weekly(1, 3))).toBe(false);
  });
});

describe("getRingCounts", () => {
  it("counts daily habits and ignores weekly habits that are not done today", () => {
    const habits = [
      habit("a", daily(true)),
      habit("b", daily(false)),
      habit("c", weekly(1, 3)),
      habit("d", weekly(3, 3)),
    ];
    expect(getRingCounts(habits)).toEqual({ done: 1, total: 2 });
  });

  it("counts a weekly habit once it is done today", () => {
    const habits = [habit("a", daily(true)), habit("c", weekly(2, 3, true))];
    expect(getRingCounts(habits)).toEqual({ done: 2, total: 2 });
  });

  it("is empty when only weekly habits are open", () => {
    expect(getRingCounts([habit("c", weekly(0, 3))])).toEqual({ done: 0, total: 0 });
  });
});

describe("splitOffDay", () => {
  it("separates off-day habits and keeps each group in order", () => {
    const habits = [
      habit("a", weekly(3, 3)),
      habit("b", daily(false)),
      habit("c", weekly(2, 2)),
      habit("d", weekly(1, 3)),
    ];
    const { active, offDay } = splitOffDay(habits);
    expect(active.map((h) => h.id)).toEqual(["b", "d"]);
    expect(offDay.map((h) => h.id)).toEqual(["a", "c"]);
  });
});
