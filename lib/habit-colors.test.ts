import { describe, expect, it } from "vitest";
import { categoryTagClass, habitFillClass, habitTileClass } from "@/lib/habit-colors";
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

describe("habitFillClass", () => {
  it("tints the card fill in each habit colour", () => {
    for (const color of HABIT_COLORS) {
      expect(habitFillClass(color)).toBe(`bg-habit-${color}/25`);
    }
  });

  it("falls back to indigo for an unknown colour", () => {
    expect(habitFillClass("chartreuse")).toContain("bg-habit-indigo");
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
