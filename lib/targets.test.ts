import { describe, expect, it } from "vitest";
import { planTargetChange, type StoredTarget } from "./targets";

const target = (id: string, effectiveFrom: string, days: number): StoredTarget => ({
  id,
  frequency: days === 7 ? "DAILY" : "WEEKLY",
  targetDaysPerWeek: days,
  effectiveFrom,
});

const WEEK = "2026-10-12";
const weekly3 = { frequency: "WEEKLY" as const, targetDaysPerWeek: 3 };

describe("planTargetChange", () => {
  it("does nothing when the target in force is unchanged", () => {
    expect(planTargetChange([target("t1", "2026-09-28", 3)], WEEK, weekly3)).toEqual({
      type: "none",
    });
  });

  it("adds a target from this week when an older one differs, keeping the past intact", () => {
    expect(planTargetChange([target("t1", "2026-09-28", 5)], WEEK, weekly3)).toEqual({
      type: "create",
    });
  });

  it("changes a target that already starts this week in place", () => {
    expect(planTargetChange([target("t1", WEEK, 5)], WEEK, weekly3)).toEqual({
      type: "update",
      id: "t1",
    });
  });

  it("compares against the newest target that has started, not a later one", () => {
    const targets = [target("t1", "2026-09-14", 3), target("t2", "2026-09-28", 5)];

    expect(planTargetChange(targets, WEEK, weekly3)).toEqual({ type: "create" });
  });

  it("notices a switch between daily and weekly", () => {
    expect(
      planTargetChange([target("t1", "2026-09-28", 7)], WEEK, { frequency: "WEEKLY", targetDaysPerWeek: 3 }),
    ).toEqual({ type: "create" });
  });
});
