import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { habit: { findMany } } }));

import { getToday } from "./today";

const day = (key: string) => new Date(`${key}T00:00:00.000Z`);

const habitRow = (overrides = {}) => ({
  id: "h1",
  name: "Drink 2L of water",
  description: "Stay hydrated",
  icon: "💧",
  color: "sky",
  dailyGoal: null,
  category: { name: "health" },
  targets: [{ frequency: "DAILY", targetDaysPerWeek: 7, effectiveFrom: day("2026-10-05") }],
  completions: [
    { date: day("2026-10-12"), amount: 1 },
    { date: day("2026-10-13"), amount: 1 },
  ],
  ...overrides,
});

describe("getToday", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks only for the user's own active habits", async () => {
    findMany.mockResolvedValue([]);

    await getToday("u1", "2026-10-13");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", archivedAt: null } }),
    );
  });

  it("returns an empty list when the user has no habits", async () => {
    findMany.mockResolvedValue([]);

    expect((await getToday("u1", "2026-10-13")).habits).toEqual([]);
  });

  it("maps a habit to a row with its category and current streak", async () => {
    findMany.mockResolvedValue([habitRow()]);

    const {
      habits: [row],
    } = await getToday("u1", "2026-10-13");

    expect(row).toMatchObject({
      id: "h1",
      name: "Drink 2L of water",
      icon: "💧",
      color: "sky",
      categoryName: "health",
      streak: { unit: "day", current: 2, best: 2 },
    });
  });

  it("reports today's progress for the row", async () => {
    findMany.mockResolvedValue([
      habitRow({
        dailyGoal: 2000,
        unit: "ml",
        completions: [{ date: day("2026-10-13"), amount: 1500 }],
      }),
    ]);

    const {
      habits: [row],
    } = await getToday("u1", "2026-10-13");

    expect(row.unit).toBe("ml");
    expect(row.progress).toEqual({ amount: 1500, goal: 2000, complete: false, week: null });
  });

  it("gives weekly habits a week streak", async () => {
    findMany.mockResolvedValue([
      habitRow({
        targets: [{ frequency: "WEEKLY", targetDaysPerWeek: 2, effectiveFrom: day("2026-09-28") }],
        completions: [
          { date: day("2026-10-05"), amount: 1 },
          { date: day("2026-10-06"), amount: 1 },
        ],
      }),
    ]);

    const {
      habits: [row],
    } = await getToday("u1", "2026-10-13");

    expect(row.streak).toEqual({ unit: "week", current: 1, best: 1 });
  });

  it("counts a multi-step habit only once its goal is reached", async () => {
    findMany.mockResolvedValue([
      habitRow({
        dailyGoal: 2000,
        completions: [
          { date: day("2026-10-12"), amount: 2000 },
          { date: day("2026-10-13"), amount: 1500 },
        ],
      }),
    ]);

    const {
      habits: [row],
    } = await getToday("u1", "2026-10-13");

    expect(row.streak.current).toBe(1);
  });
});
