import { describe, expect, it } from "vitest";
import { seedCategories } from "./seed-data";

const allHabits = seedCategories.flatMap((c) => c.habits);

describe("seed data", () => {
  it("has the 7 expected categories", () => {
    expect(seedCategories.map((c) => c.name)).toEqual([
      "health",
      "fitness",
      "learning",
      "mindfulness",
      "productivity",
      "sleep",
      "social",
    ]);
  });

  it("has 10 habits per category, 70 in total", () => {
    for (const category of seedCategories) expect(category.habits).toHaveLength(10);
    expect(allHabits).toHaveLength(70);
  });

  it("has unique names, so the upsert by name is stable", () => {
    expect(new Set(allHabits.map((h) => h.name)).size).toBe(allHabits.length);
  });

  it("gives every habit an icon and a description", () => {
    for (const habit of allHabits) {
      expect(habit.icon, habit.name).not.toBe("");
      expect(habit.description, habit.name).not.toBe("");
    }
  });

  it("uses 7 days for daily habits and 1-6 for weekly ones", () => {
    for (const habit of allHabits) {
      if (habit.defaultFrequency === "DAILY") {
        expect(habit.defaultTargetDaysPerWeek, habit.name).toBe(7);
      } else {
        expect(habit.defaultTargetDaysPerWeek, habit.name).toBeGreaterThanOrEqual(1);
        expect(habit.defaultTargetDaysPerWeek, habit.name).toBeLessThanOrEqual(6);
      }
    }
  });

  it("sets goal, unit and step size together, with a step that fits the goal", () => {
    const multiStep = allHabits.filter((h) => h.defaultDailyGoal !== undefined);
    expect(multiStep.length).toBeGreaterThan(0);

    for (const habit of allHabits) {
      const set = [habit.defaultDailyGoal, habit.defaultUnit, habit.defaultStepSize].filter(
        (v) => v !== undefined,
      );
      expect(set.length === 0 || set.length === 3, habit.name).toBe(true);
    }
    for (const habit of multiStep) {
      expect(habit.defaultDailyGoal! % habit.defaultStepSize!, habit.name).toBe(0);
    }
  });

  it("includes the water, meditation and steps goals", () => {
    const byName = Object.fromEntries(allHabits.map((h) => [h.name, h]));
    expect(byName["Drink 2L of water"]).toMatchObject({ defaultDailyGoal: 2000, defaultUnit: "ml" });
    expect(byName["Meditate"]).toMatchObject({ defaultUnit: "min" });
    expect(byName["10,000 steps"]).toMatchObject({ defaultDailyGoal: 10000, defaultUnit: "steps" });
  });
});
