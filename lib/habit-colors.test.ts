import { describe, expect, it } from "vitest";
import { categoryTagClass, habitProgressClass, habitTileClass } from "@/lib/habit-colors";
import { HABIT_COLORS } from "@/types/habits";

describe("habitTileClass", () => {
  it("has a tint for each of the 9 habit colours", () => {
    for (const color of HABIT_COLORS) {
      expect(habitTileClass(color)).toBe(`bg-habit-${color}/15`);
    }
  });

  it("falls back to indigo for an unknown colour", () => {
    expect(habitTileClass("chartreuse")).toBe("bg-habit-indigo/15");
  });
});

describe("habitProgressClass", () => {
  it("colours the progress fill in each habit colour for both browser engines", () => {
    for (const color of HABIT_COLORS) {
      expect(habitProgressClass(color)).toContain(`[&::-webkit-progress-value]:bg-habit-${color}`);
      expect(habitProgressClass(color)).toContain(`[&::-moz-progress-bar]:bg-habit-${color}`);
    }
  });

  it("falls back to indigo for an unknown colour", () => {
    expect(habitProgressClass("chartreuse")).toContain("bg-habit-indigo");
  });
});

describe("categoryTagClass", () => {
  it("tints a tag in its category colour", () => {
    expect(categoryTagClass("health")).toBe("bg-cat-health/15");
    expect(categoryTagClass("sleep")).toBe("bg-cat-sleep/15");
  });

  it("falls back to a neutral tint for an unknown category", () => {
    expect(categoryTagClass("cooking")).toBe("bg-muted");
  });
});
