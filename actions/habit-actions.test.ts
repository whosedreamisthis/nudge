import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionUser,
  findFirst,
  findCategory,
  update,
  updateMany,
  deleteMany,
  revalidatePath,
} = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findFirst: vi.fn(),
  findCategory: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    habit: { findFirst, update, updateMany, deleteMany },
    category: { findUnique: findCategory },
  },
}));

import { archiveHabit, deleteHabit, restoreHabit, updateHabit } from "./habits";

// 2026-10-14 03:00 in Auckland: that week starts on Monday 2026-10-12
const NOW = new Date("2026-10-13T14:00:00Z");

describe("updateHabit", () => {
  const input = {
    habitId: "h1",
    name: "Read more",
    description: "",
    categoryId: "c1",
    frequency: "WEEKLY" as const,
    targetDaysPerWeek: 3,
    icon: "📚",
    color: "sky" as const,
  };
  const target = (id: string, from: string, days: number) => ({
    id,
    frequency: days === 7 ? "DAILY" : "WEEKLY",
    targetDaysPerWeek: days,
    effectiveFrom: new Date(`${from}T00:00:00.000Z`),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({
      id: "u1",
      timezone: "Pacific/Auckland",
    });
    findFirst.mockResolvedValue({
      id: "h1",
      targets: [target("t1", "2026-09-28", 3)],
    });
    findCategory.mockResolvedValue({ id: "c1" });
    update.mockResolvedValue({});
  });

  it("updates the details without touching an unchanged target", async () => {
    const result = await updateHabit(input);

    expect(result).toEqual({ success: true, data: { id: "h1" } });
    expect(update).toHaveBeenCalledWith({
      where: { id: "h1" },
      data: {
        name: "Read more",
        description: "",
        categoryId: "c1",
        icon: "📚",
        color: "sky",
        dailyGoal: null,
        unit: null,
        stepSize: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
  });

  it("only edits the user's own active habits", async () => {
    await updateHabit(input);

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "h1", userId: "u1", archivedAt: null },
      }),
    );
  });

  it("starts a changed target on the user's local Monday", async () => {
    await updateHabit({ ...input, targetDaysPerWeek: 5 });

    expect(update.mock.calls[0][0].data.targets).toEqual({
      create: {
        frequency: "WEEKLY",
        targetDaysPerWeek: 5,
        effectiveFrom: new Date("2026-10-12T00:00:00.000Z"),
      },
    });
  });

  it("changes a target that already starts this week in place", async () => {
    findFirst.mockResolvedValue({
      id: "h1",
      targets: [target("t2", "2026-10-12", 3)],
    });

    await updateHabit({ ...input, frequency: "DAILY", targetDaysPerWeek: 2 });

    expect(update.mock.calls[0][0].data.targets).toEqual({
      update: {
        where: { id: "t2" },
        data: { frequency: "DAILY", targetDaysPerWeek: 7 },
      },
    });
  });

  it("rejects a habit that is not the user's", async () => {
    findFirst.mockResolvedValue(null);

    expect(await updateHabit(input)).toEqual({
      success: false,
      error: "Habit not found",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a missing category and invalid input", async () => {
    findCategory.mockResolvedValue(null);
    expect(await updateHabit(input)).toEqual({
      success: false,
      error: "Category not found",
    });

    expect(await updateHabit({ ...input, name: " " })).toEqual({
      success: false,
      error: "Give your habit a name",
    });
  });

  it("rejects a signed-out user", async () => {
    getSessionUser.mockResolvedValue(null);

    expect(await updateHabit(input)).toEqual({
      success: false,
      error: "Not signed in",
    });
  });

  it("reports a failed write without revalidating", async () => {
    update.mockRejectedValue(new Error("db down"));

    expect(await updateHabit(input)).toEqual({
      success: false,
      error: "Could not save the habit, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("archiveHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("stamps archivedAt on the user's active habit", async () => {
    const result = await archiveHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { id: "h1" } });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "h1", userId: "u1", archivedAt: null },
      data: { archivedAt: expect.any(Date) },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
  });

  it("rejects a habit that is not found, a signed-out user and bad input", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await archiveHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Habit not found",
    });

    getSessionUser.mockResolvedValue(null);
    expect(await archiveHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Not signed in",
    });

    expect(await archiveHabit({ habitId: "" })).toEqual({
      success: false,
      error: "Invalid habit",
    });
  });
});

describe("deleteHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
    findFirst.mockResolvedValue({ id: "h1", systemHabitId: null });
    deleteMany.mockResolvedValue({ count: 1 });
  });

  it("deletes a custom habit of the user", async () => {
    const result = await deleteHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { id: "h1" } });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "h1", userId: "u1" } }),
    );
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: "h1", userId: "u1", systemHabitId: null },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
  });

  it("refuses to delete a catalog habit", async () => {
    findFirst.mockResolvedValue({ id: "h1", systemHabitId: "s1" });

    expect(await deleteHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Catalog habits can't be deleted, archive it instead",
    });
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("rejects a habit that is not found or a signed-out user", async () => {
    findFirst.mockResolvedValue(null);
    expect(await deleteHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Habit not found",
    });

    getSessionUser.mockResolvedValue(null);
    expect(await deleteHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Not signed in",
    });
  });

  it("reports a failed delete without revalidating", async () => {
    deleteMany.mockRejectedValue(new Error("db down"));

    expect(await deleteHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Could not delete the habit, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("restoreHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({
      id: "u1",
      timezone: "Pacific/Auckland",
    });
    findFirst
      .mockReset()
      .mockResolvedValueOnce({ id: "h1", systemHabitId: null })
      .mockResolvedValue(null);
    update.mockResolvedValue({});
  });

  it("clears archivedAt and today's completion, keeping earlier days", async () => {
    const result = await restoreHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { id: "h1" } });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "h1", userId: "u1", archivedAt: { not: null } },
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "h1" },
      // Wednesday 2026-10-14 in Auckland, though it is still the 13th in UTC
      data: {
        archivedAt: null,
        completions: {
          deleteMany: { date: new Date("2026-10-14T00:00:00.000Z") },
        },
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
    expect(revalidatePath).toHaveBeenCalledWith("/habits");
  });

  it("restores a catalog habit when no active copy exists", async () => {
    findFirst
      .mockReset()
      .mockResolvedValueOnce({ id: "h1", systemHabitId: "s1" })
      .mockResolvedValue(null);

    expect((await restoreHabit({ habitId: "h1" })).success).toBe(true);
    expect(findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { userId: "u1", systemHabitId: "s1", archivedAt: null },
      }),
    );
  });

  it("refuses to restore next to an active copy of the same catalog habit", async () => {
    findFirst
      .mockReset()
      .mockResolvedValueOnce({ id: "h1", systemHabitId: "s1" })
      .mockResolvedValueOnce({ id: "h2" });

    expect(await restoreHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "You already have this habit",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a habit that is not archived or not found, a signed-out user and bad input", async () => {
    findFirst.mockReset().mockResolvedValue(null);
    expect(await restoreHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Habit not found",
    });

    getSessionUser.mockResolvedValue(null);
    expect(await restoreHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Not signed in",
    });

    expect(await restoreHabit({ habitId: "" })).toEqual({
      success: false,
      error: "Invalid habit",
    });
  });

  it("reports a failed write without revalidating", async () => {
    update.mockRejectedValue(new Error("db down"));

    expect(await restoreHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Could not restore the habit, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
