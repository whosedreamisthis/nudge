import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, count } = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { habit: { findMany, count } } }));

import { countArchivedHabits, getArchivedHabits } from "./archived";

describe("archived habits queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(2);
  });

  it("lists only the user's archived habits, newest archive first", async () => {
    await getArchivedHabits("u1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", archivedAt: { not: null } },
        orderBy: { archivedAt: "desc" },
      }),
    );
  });

  it("counts the same set for the tab", async () => {
    expect(await countArchivedHabits("u1")).toBe(2);
    expect(count).toHaveBeenCalledWith({ where: { userId: "u1", archivedAt: { not: null } } });
  });
});
