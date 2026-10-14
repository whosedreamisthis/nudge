import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { habit: { findMany } } }));

import { getWeekGrid } from "./progress";

const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const WEEK = "2026-10-12";
const TODAY = "2026-10-14";

const habitRow = (overrides = {}) => ({
  id: "h1",
  name: "Morning run",
  icon: "🏃",
  color: "red",
  dailyGoal: null,
  createdAt: new Date("2026-09-01T12:00:00Z"),
  targets: [{ frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: day("2026-08-31") }],
  completions: [{ date: day("2026-10-12"), amount: 1 }],
  ...overrides,
});

describe("getWeekGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([habitRow()]);
  });

  it("asks for the user's active habits with only the shown week's completions", async () => {
    await getWeekGrid("u1", "UTC", WEEK, TODAY);

    expect(findMany).toHaveBeenCalledTimes(1);
    const call = findMany.mock.calls[0][0];
    expect(call.where).toEqual({ userId: "u1", archivedAt: null });
    expect(call.select.completions.where).toEqual({
      date: { gte: day("2026-10-12"), lte: day("2026-10-18") },
    });
  });

  it("maps a habit to a grid row", async () => {
    const [row] = await getWeekGrid("u1", "UTC", WEEK, TODAY);

    expect(row).toMatchObject({ id: "h1", name: "Morning run", color: "red", done: 1, target: 7 });
    expect(row.days[0]).toEqual({ date: "2026-10-12", state: "done" });
  });

  it("dates the habit by the user's timezone", async () => {
    // 2026-10-14 02:00 UTC is still the 13th in Vancouver
    findMany.mockResolvedValue([habitRow({ createdAt: new Date("2026-10-14T02:00:00Z") })]);

    const [row] = await getWeekGrid("u1", "America/Vancouver", WEEK, TODAY);

    expect(row.days[1].state).toBe("open");
    expect(row.days[0].state).toBe("done");
  });

  it("still lists a habit created after the shown week, with every day empty", async () => {
    findMany.mockResolvedValue([
      habitRow({ createdAt: new Date("2026-10-20T12:00:00Z"), completions: [] }),
    ]);

    const rows = await getWeekGrid("u1", "UTC", WEEK, TODAY);

    expect(rows).toHaveLength(1);
    expect(rows[0].days.every((d) => d.state === "before")).toBe(true);
    expect(rows[0].done).toBe(0);
  });
});
