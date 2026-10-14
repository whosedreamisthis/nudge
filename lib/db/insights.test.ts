import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { habitCompletion: { findMany } } }));

import { getInsights } from "./insights";

const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const TODAY = "2026-10-14";

const row = (date: string, amount: number, dailyGoal: number | null = null) => ({
  date: day(date),
  amount,
  habit: { dailyGoal },
});

describe("getInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("makes one query for the user's last 60 days, archived habits included", async () => {
    await getInsights("u1", TODAY);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", date: { gte: day("2026-08-16"), lte: day(TODAY) } },
      }),
    );
    expect(findMany.mock.calls[0][0].where).not.toHaveProperty("habit");
  });

  it("compares the last 30 days with the 30 before and charts the two weeks", async () => {
    findMany.mockResolvedValue([
      row("2026-09-01", 1),
      row("2026-10-05", 1),
      row("2026-10-14", 1),
      row("2026-10-14", 1),
    ]);

    const { last30, previous30, thisWeek, lastWeek } = await getInsights("u1", TODAY);

    expect(last30).toBe(3);
    expect(previous30).toBe(1);
    expect(thisWeek[2].count).toBe(2);
    expect(lastWeek[0].count).toBe(1);
  });

  it("counts a habit with a daily goal only once the goal is reached", async () => {
    findMany.mockResolvedValue([
      row("2026-10-14", 1500, 2000),
      row("2026-10-13", 2000, 2000),
    ]);

    const { last30 } = await getInsights("u1", TODAY);

    expect(last30).toBe(1);
  });
});
