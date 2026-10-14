import { describe, expect, it } from "vitest";
import { buildHeatmap, heatLevel, heatmapStart, HEATMAP_WEEKS } from "./consistency";

// Wednesday 2026-10-14: this week started on Monday the 12th
const TODAY = "2026-10-14";

describe("heatLevel", () => {
  it("is 0 for nothing, and for an empty period", () => {
    expect(heatLevel(0, 5)).toBe(0);
    expect(heatLevel(0, 0)).toBe(0);
  });

  it("scales between 1 and 4 against the busiest day", () => {
    expect(heatLevel(1, 8)).toBe(1);
    expect(heatLevel(2, 8)).toBe(1);
    expect(heatLevel(3, 8)).toBe(2);
    expect(heatLevel(5, 8)).toBe(3);
    expect(heatLevel(8, 8)).toBe(4);
  });

  it("always shows a completion as at least step 1", () => {
    expect(heatLevel(1, 1000)).toBe(1);
  });
});

describe("heatmapStart", () => {
  it("is the Monday 13 weeks before this week's Monday", () => {
    expect(heatmapStart(TODAY)).toBe("2026-07-13");
  });
});

describe("buildHeatmap", () => {
  it("is 14 weeks of 7 days, the last week ending today", () => {
    const { weeks } = buildHeatmap(new Map(), TODAY);

    expect(weeks).toHaveLength(HEATMAP_WEEKS);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]?.date).toBe("2026-07-13");
    // Monday, Tuesday and Wednesday of this week; the rest has not happened yet
    expect(weeks[13].map((day) => day?.date ?? null)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      null,
      null,
      null,
      null,
    ]);
  });

  it("totals the completions and gives each day a step", () => {
    const counts = new Map([
      ["2026-10-14", 4],
      ["2026-10-13", 2],
      ["2026-07-13", 1],
    ]);

    const { weeks, total } = buildHeatmap(counts, TODAY);

    expect(total).toBe(7);
    expect(weeks[13][2]).toEqual({ date: "2026-10-14", count: 4, level: 4 });
    expect(weeks[13][1]).toEqual({ date: "2026-10-13", count: 2, level: 2 });
    expect(weeks[0][0]).toEqual({ date: "2026-07-13", count: 1, level: 1 });
    expect(weeks[13][0]).toEqual({ date: "2026-10-12", count: 0, level: 0 });
  });

  it("ignores days outside the period", () => {
    const counts = new Map([
      ["2026-07-12", 9],
      ["2026-10-15", 9],
    ]);

    expect(buildHeatmap(counts, TODAY).total).toBe(0);
  });

  it("is all empty when nothing was completed", () => {
    const { weeks, total } = buildHeatmap(new Map(), TODAY);

    expect(total).toBe(0);
    expect(weeks.flat().every((day) => day === null || day.level === 0)).toBe(true);
  });
});
