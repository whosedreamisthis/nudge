import { describe, expect, it } from "vitest";
import {
  createHabitSchema,
  goalData,
  HABIT_ICONS,
  setAmountSchema,
  updateHabitSchema,
} from "./habit-form";
import { undoAmount } from "./progress";

const valid = {
  name: "Drink water",
  description: "",
  categoryId: "c1",
  frequency: "DAILY" as const,
  targetDaysPerWeek: 7,
  icon: HABIT_ICONS[0],
  color: "sky" as const,
};

describe("daily goal in the habit form", () => {
  const goal = { dailyGoal: 8, unit: "glasses", stepSize: 1 };

  it("accepts a habit with no goal, or a full goal", () => {
    expect(createHabitSchema.safeParse(valid).success).toBe(true);
    expect(
      createHabitSchema.safeParse({ ...valid, dailyGoal: null, unit: null, stepSize: null })
        .success,
    ).toBe(true);
    expect(createHabitSchema.safeParse({ ...valid, ...goal }).success).toBe(true);
  });

  it("asks for a unit once there is a goal", () => {
    const result = createHabitSchema.safeParse({ ...valid, ...goal, unit: " " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Add a unit for the goal, like ml or times");
  });

  it("needs a step that fits inside the goal", () => {
    for (const stepSize of [null, 9]) {
      const result = createHabitSchema.safeParse({ ...valid, ...goal, stepSize });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("The step must be between 1 and the goal");
    }
  });

  it("rejects a goal of 1, which is a plain check", () => {
    expect(createHabitSchema.safeParse({ ...valid, ...goal, dailyGoal: 1 }).success).toBe(false);
  });

  it("applies the same rules when editing", () => {
    expect(updateHabitSchema.safeParse({ ...valid, ...goal, habitId: "h1" }).success).toBe(true);
    expect(
      updateHabitSchema.safeParse({ ...valid, ...goal, unit: "", habitId: "h1" }).success,
    ).toBe(false);
  });
});

describe("goalData", () => {
  it("keeps all three together", () => {
    expect(goalData({ dailyGoal: 8, unit: "glasses", stepSize: 1 })).toEqual({
      dailyGoal: 8,
      unit: "glasses",
      stepSize: 1,
    });
  });

  it("clears all three when there is no goal", () => {
    expect(goalData({ dailyGoal: null, unit: "glasses", stepSize: 1 })).toEqual({
      dailyGoal: null,
      unit: null,
      stepSize: null,
    });
    expect(goalData({})).toEqual({ dailyGoal: null, unit: null, stepSize: null });
  });
});

describe("setAmountSchema", () => {
  it("accepts 0 and amounts past any goal", () => {
    expect(setAmountSchema.safeParse({ habitId: "h1", amount: 0 }).success).toBe(true);
    expect(setAmountSchema.safeParse({ habitId: "h1", amount: 5000 }).success).toBe(true);
  });

  it("rejects negative, fractional and huge amounts", () => {
    expect(setAmountSchema.safeParse({ habitId: "h1", amount: -1 }).success).toBe(false);
    expect(setAmountSchema.safeParse({ habitId: "h1", amount: 1.5 }).success).toBe(false);
    expect(setAmountSchema.safeParse({ habitId: "h1", amount: 10000000 }).success).toBe(false);
  });
});

describe("undoAmount", () => {
  it("takes one step back", () => {
    expect(undoAmount(750, 250)).toBe(500);
  });

  it("removes a single step, never going below 0", () => {
    expect(undoAmount(250, 250)).toBe(0);
    expect(undoAmount(100, 250)).toBe(0);
    expect(undoAmount(0, 250)).toBe(0);
  });

  it("clears the day for a habit without a step", () => {
    expect(undoAmount(3, null)).toBe(0);
  });

  it("steps back from an amount past the goal", () => {
    expect(undoAmount(2300, 250)).toBe(2050);
  });
});
