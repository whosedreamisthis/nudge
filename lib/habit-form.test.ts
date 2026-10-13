import { describe, expect, it } from "vitest";
import { createHabitSchema, HABIT_ICONS, isDailyTarget } from "./habit-form";

const valid = {
  name: "Read",
  description: "",
  categoryId: "c1",
  frequency: "WEEKLY" as const,
  targetDaysPerWeek: 3,
  icon: HABIT_ICONS[0],
  color: "indigo" as const,
};

describe("createHabitSchema", () => {
  it("accepts a valid habit and trims the text", () => {
    const result = createHabitSchema.parse({ ...valid, name: "  Read  ", description: " x " });

    expect(result.name).toBe("Read");
    expect(result.description).toBe("x");
  });

  it("rejects a blank name with a readable message", () => {
    const result = createHabitSchema.safeParse({ ...valid, name: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Give your habit a name");
  });

  it("rejects a name or description that is too long", () => {
    expect(createHabitSchema.safeParse({ ...valid, name: "a".repeat(61) }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...valid, description: "a".repeat(201) }).success).toBe(
      false,
    );
  });

  it("only allows 1 to 7 whole days per week", () => {
    for (const days of [0, 8, 2.5]) {
      expect(createHabitSchema.safeParse({ ...valid, targetDaysPerWeek: days }).success).toBe(
        false,
      );
    }
    expect(createHabitSchema.safeParse({ ...valid, targetDaysPerWeek: 7 }).success).toBe(true);
  });

  it("rejects an icon, colour or frequency outside the pickers", () => {
    expect(createHabitSchema.safeParse({ ...valid, icon: "🦄" }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...valid, color: "orange" }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...valid, frequency: "MONTHLY" }).success).toBe(false);
  });

  it("requires a category", () => {
    expect(createHabitSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
  });
});

describe("isDailyTarget", () => {
  it("is daily for a daily frequency or seven days", () => {
    expect(isDailyTarget("DAILY", 7)).toBe(true);
    expect(isDailyTarget("WEEKLY", 7)).toBe(true);
  });

  it("is not daily for a weekly habit with fewer days", () => {
    expect(isDailyTarget("WEEKLY", 3)).toBe(false);
  });
});
