import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { habit: { findFirst } } }));

import { getFocusHabit } from "./focus";

describe("getFocusHabit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("looks up only the user's own active habit", async () => {
    findFirst.mockResolvedValue({ id: "h1", name: "Meditate" });

    expect(await getFocusHabit("u1", "h1")).toEqual({ id: "h1", name: "Meditate" });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "h1", userId: "u1", archivedAt: null },
      select: { id: true, name: true },
    });
  });

  it("returns null when there is no such habit", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getFocusHabit("u1", "other")).toBeNull();
  });
});
