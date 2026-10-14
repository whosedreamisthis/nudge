import { describe, expect, it } from "vitest";
import { buildHeatmap } from "./consistency";
import { buildInsights, habitPerformance, insightsStart, weeklyAverage } from "./insights";
import type { GridRow } from "./week-grid";

// Wednesday 2026-10-14: this week started on Monday the 12th, last week on the 5th
const TODAY = "2026-10-14";

describe("insightsStart", () => {
  it("is the first day of the previous 30-day period", () => {
    expect(insightsStart(TODAY)).toBe("2026-08-16");
  });
});

describe("buildInsights", () => {
  const counts = new Map([
    ["2026-10-05", 2],
    ["2026-10-12", 3],
    ["2026-10-14", 1],
    ["2026-10-08", 4],
  ]);

  it("lays out both weeks Monday to Sunday", () => {
    const { thisWeek, lastWeek } = buildInsights(counts, TODAY);

    expect(thisWeek[0].date).toBe("2026-10-12");
    expect(thisWeek.map((d) => d.count)).toEqual([3, 0, 1, 0, 0, 0, 0]);
    expect(lastWeek.map((d) => d.count)).toEqual([2, 0, 0, 4, 0, 0, 0]);
  });

  it("shows days after today as 0", () => {
    const { thisWeek } = buildInsights(new Map([["2026-10-16", 5]]), TODAY);

    expect(thisWeek[4].count).toBe(0);
  });

  it("sums the last 30 days: today and the 29 before", () => {
    const edge = new Map([
      ["2026-10-14", 1],
      ["2026-09-15", 2],
      ["2026-09-14", 8],
    ]);

    expect(buildInsights(edge, TODAY).last30).toBe(3);
  });

  it("sums the 30 days before those as the previous period", () => {
    const edge = new Map([
      ["2026-09-14", 8],
      ["2026-08-16", 1],
      ["2026-08-15", 9],
    ]);

    expect(buildInsights(edge, TODAY).previous30).toBe(9);
  });

  it("is 0 with nothing completed", () => {
    expect(buildInsights(new Map(), TODAY)).toMatchObject({ last30: 0, previous30: 0 });
  });
});

describe("weeklyAverage", () => {
  const heatmap = (entries: [string, number][]) => buildHeatmap(new Map(entries), TODAY);

  it("averages the last 7 days (today and the 6 before) to one decimal", () => {
    // Oct 8 to Oct 14: 4 + 3 + 1 = 8 completions; Oct 7 is outside
    const map = heatmap([
      ["2026-10-07", 9],
      ["2026-10-08", 4],
      ["2026-10-12", 3],
      ["2026-10-14", 1],
    ]);

    expect(weeklyAverage(map, TODAY)).toBe(1.1);
  });

  it("is 0 with nothing completed", () => {
    expect(weeklyAverage(heatmap([]), TODAY)).toBe(0);
  });
});

describe("habitPerformance", () => {
  const row = (done: number, target: number): GridRow => ({
    id: "h",
    name: "Read",
    icon: "📚",
    color: "sky",
    days: [],
    done,
    target,
    met: done >= target,
  });

  it("is done against the habit's own target, rounded", () => {
    expect(habitPerformance([row(2, 7)])[0]).toMatchObject({ done: 2, target: 7, percent: 29 });
    expect(habitPerformance([row(1, 3)])[0].percent).toBe(33);
  });

  it("caps at 100% when more days than the target were done", () => {
    expect(habitPerformance([row(5, 3)])[0].percent).toBe(100);
  });

  it("is 0% for none done", () => {
    expect(habitPerformance([row(0, 7)])[0].percent).toBe(0);
  });
});
