import { describe, expect, it } from "vitest";
import { habitSolidClass } from "@/lib/habit-colors";
import { HABIT_COLORS } from "@/types/habits";

describe("habitSolidClass", () => {
  it("is a solid block in each of the 9 habit colours", () => {
    for (const color of HABIT_COLORS) {
      expect(habitSolidClass(color)).toBe(`bg-habit-${color}`);
    }
  });

  it("falls back to indigo for an unknown colour", () => {
    expect(habitSolidClass("chartreuse")).toBe("bg-habit-indigo");
  });
});
