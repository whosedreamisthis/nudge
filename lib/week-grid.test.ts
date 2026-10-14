import { describe, expect, it } from "vitest";
import {
  buildWeekGrid,
  resolveWeek,
  topHabit,
  weekRangeLabel,
  type GridHabitInput,
} from "./week-grid";

// Wednesday 2026-10-14: this week runs Monday the 12th to Sunday the 18th
const TODAY = "2026-10-14";
const WEEK = "2026-10-12";

const habit = (overrides: Partial<GridHabitInput> = {}): GridHabitInput => ({
  id: "h1",
  name: "Morning run",
  icon: "🏃",
  color: "red",
  createdOn: "2026-09-01",
  dailyGoal: null,
  targets: [{ frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: "2026-08-31" }],
  completions: [],
  ...overrides,
});

describe("buildWeekGrid", () => {
  it("lays out Monday to Sunday with done, open and future days", () => {
    const [row] = buildWeekGrid(
      [habit({ completions: [{ date: "2026-10-12", amount: 1 }] })],
      WEEK,
      TODAY,
    );

    expect(row.days.map((d) => d.date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(row.days.map((d) => d.state)).toEqual([
      "done",
      "open",
      "open",
      "future",
      "future",
      "future",
      "future",
    ]);
    expect(row.done).toBe(1);
  });

  it("marks days before the habit existed", () => {
    const [row] = buildWeekGrid([habit({ createdOn: "2026-10-14" })], WEEK, TODAY);

    expect(row.days.map((d) => d.state).slice(0, 3)).toEqual(["before", "before", "open"]);
  });

  it("counts a goal habit as done only once the goal is reached", () => {
    const [row] = buildWeekGrid(
      [
        habit({
          dailyGoal: 2000,
          completions: [
            { date: "2026-10-12", amount: 2000 },
            { date: "2026-10-13", amount: 1500 },
          ],
        }),
      ],
      WEEK,
      TODAY,
    );

    expect(row.days[0].state).toBe("done");
    expect(row.days[1].state).toBe("open");
    expect(row.done).toBe(1);
  });

  it("uses the weekly target, and calls the week met once it is reached", () => {
    const weekly = habit({
      targets: [{ frequency: "WEEKLY", targetDaysPerWeek: 2, effectiveFrom: "2026-08-31" }],
      completions: [
        { date: "2026-10-12", amount: 1 },
        { date: "2026-10-14", amount: 1 },
      ],
    });

    const [row] = buildWeekGrid([weekly], WEEK, TODAY);

    expect(row).toMatchObject({ done: 2, target: 2, met: true });
    // The unchecked day is plain, not a miss: it is just open
    expect(row.days[1].state).toBe("open");
  });

  it("uses the target that applied in the shown week, not today's", () => {
    const changed = habit({
      targets: [
        { frequency: "WEEKLY", targetDaysPerWeek: 3, effectiveFrom: "2026-08-31" },
        { frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: "2026-10-12" },
      ],
    });

    expect(buildWeekGrid([changed], "2026-10-05", TODAY)[0].target).toBe(3);
    expect(buildWeekGrid([changed], WEEK, TODAY)[0].target).toBe(7);
  });

  it("shows every day of a past week as done or open, none as future", () => {
    const [row] = buildWeekGrid([habit()], "2026-10-05", TODAY);

    expect(row.days.every((d) => d.state === "open")).toBe(true);
  });
});

describe("topHabit", () => {
  const rows = buildWeekGrid(
    [
      habit({ id: "a", completions: [{ date: "2026-10-12", amount: 1 }] }),
      habit({
        id: "b",
        completions: [
          { date: "2026-10-12", amount: 1 },
          { date: "2026-10-13", amount: 1 },
        ],
      }),
      habit({ id: "c", completions: [] }),
    ],
    WEEK,
    TODAY,
  );

  it("is the habit with the most completed days", () => {
    expect(topHabit(rows)?.id).toBe("b");
  });

  it("lets the first habit win a tie", () => {
    const tied = buildWeekGrid(
      [
        habit({ id: "a", completions: [{ date: "2026-10-12", amount: 1 }] }),
        habit({ id: "b", completions: [{ date: "2026-10-13", amount: 1 }] }),
      ],
      WEEK,
      TODAY,
    );

    expect(topHabit(tied)?.id).toBe("a");
  });

  it("is null when nothing was completed", () => {
    expect(topHabit(buildWeekGrid([habit()], WEEK, TODAY))).toBeNull();
    expect(topHabit([])).toBeNull();
  });
});

describe("resolveWeek", () => {
  it("defaults to this week", () => {
    expect(resolveWeek(undefined, TODAY)).toBe(WEEK);
    expect(resolveWeek("", TODAY)).toBe(WEEK);
  });

  it("snaps an earlier day to its Monday", () => {
    expect(resolveWeek("2026-10-07", TODAY)).toBe("2026-10-05");
    expect(resolveWeek("2026-10-05", TODAY)).toBe("2026-10-05");
  });

  it("never goes into the future", () => {
    expect(resolveWeek("2026-10-26", TODAY)).toBe(WEEK);
  });

  it("falls back to this week for anything that is not a real day", () => {
    for (const bad of ["nonsense", "2026-02-31", "2026-13-01", "10-05-2026"]) {
      expect(resolveWeek(bad, TODAY)).toBe(WEEK);
    }
  });
});

describe("weekRangeLabel", () => {
  it("shortens a week inside one month", () => {
    expect(weekRangeLabel("2026-10-12")).toBe("Oct 12 – 18, 2026");
  });

  it("names both months when the week crosses one", () => {
    expect(weekRangeLabel("2026-10-26")).toBe("Oct 26 – Nov 1, 2026");
  });

  it("names both years when the week crosses New Year", () => {
    expect(weekRangeLabel("2025-12-29")).toBe("Dec 29, 2025 – Jan 4, 2026");
  });
});
