import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { systemHabit: { findMany } } }));

import { getCatalogHabits } from "./catalog";

describe("getCatalogHabits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("excludes habits the user already has, and applies no other filter by default", async () => {
    await getCatalogHabits("u1", { q: "", category: "" });

    expect(findMany.mock.calls[0][0].where).toEqual({
      habits: { none: { userId: "u1", archivedAt: null } },
    });
  });

  it("combines the category with a case-insensitive search of name and description", async () => {
    await getCatalogHabits("u1", { q: "water", category: "health" });

    expect(findMany.mock.calls[0][0].where).toEqual({
      habits: { none: { userId: "u1", archivedAt: null } },
      category: { name: "health" },
      OR: [
        { name: { contains: "water", mode: "insensitive" } },
        { description: { contains: "water", mode: "insensitive" } },
      ],
    });
  });
});
