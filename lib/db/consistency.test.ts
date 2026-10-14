import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { habitCompletion: { findMany } } }));

import { getHeatmap } from "./consistency";

const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const TODAY = "2026-10-14";

const row = (date: string, amount: number, dailyGoal: number | null = null) => ({
  date: day(date),
  amount,
  habit: { dailyGoal },
});

describe("getHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("makes one query for the user's 14 weeks, archived habits included", async () => {
    await getHeatmap("u1", TODAY);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", date: { gte: day("2026-07-13"), lte: day(TODAY) } },
      }),
    );
    expect(findMany.mock.calls[0][0].where).not.toHaveProperty("habit");
  });

  it("counts the habits completed on each day", async () => {
    findMany.mockResolvedValue([
      row("2026-10-14", 1),
      row("2026-10-14", 1),
      row("2026-10-13", 1),
    ]);

    const { weeks, total } = await getHeatmap("u1", TODAY);

    expect(total).toBe(3);
    expect(weeks[13][2]).toMatchObject({ date: "2026-10-14", count: 2, level: 4 });
    expect(weeks[13][1]).toMatchObject({ date: "2026-10-13", count: 1, level: 2 });
  });

  it("counts a habit with a daily goal only once the goal is reached", async () => {
    findMany.mockResolvedValue([
      row("2026-10-14", 1500, 2000),
      row("2026-10-13", 2000, 2000),
      row("2026-10-12", 2600, 2000),
    ]);

    const { total } = await getHeatmap("u1", TODAY);

    expect(total).toBe(2);
  });
});
