import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionUser,
  findFirst,
  findUnique,
  upsert,
  remove,
  revalidatePath,
  updateTag,
  findCategory,
  createHabitRow,
  findSystemHabit,
} = vi.hoisted(() => ({
  findSystemHabit: vi.fn(),
  getSessionUser: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  findCategory: vi.fn(),
  createHabitRow: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));
vi.mock("@/lib/db", () => ({
  prisma: {
    habit: { findFirst, create: createHabitRow },
    habitCompletion: { findUnique, upsert, delete: remove },
    category: { findUnique: findCategory },
    systemHabit: { findUnique: findSystemHabit },
  },
}));

import { advanceHabit, createHabit } from "./habits";

// 2026-10-14 03:00 in Auckland is still 2026-10-13 in UTC: the local day must win
const NOW = new Date("2026-10-13T14:00:00Z");

describe("advanceHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({
      id: "u1",
      timezone: "Pacific/Auckland",
    });
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: null, stepSize: null });
    findUnique.mockResolvedValue(null);
  });

  const day = new Date("2026-10-14T00:00:00.000Z");
  const where = { habitId_date: { habitId: "h1", date: day } };

  it("completes a simple habit for the user's local today", async () => {
    const result = await advanceHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { amount: 1 } });
    expect(upsert).toHaveBeenCalledWith({
      where,
      update: { amount: 1 },
      create: { habitId: "h1", userId: "u1", date: day, amount: 1 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
    expect(updateTag).toHaveBeenCalledWith("user:u1:completions");
  });

  it("removes the completion when the habit is already done", async () => {
    findUnique.mockResolvedValue({ amount: 1 });

    const result = await advanceHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { amount: 0 } });
    expect(remove).toHaveBeenCalledWith({ where });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("steps a goal habit up to its goal", async () => {
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 2000, stepSize: 1500 });
    findUnique.mockResolvedValue({ amount: 500 });

    const result = await advanceHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { amount: 2000 } });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { amount: 2000 } }),
    );
  });

  it("clears a goal habit that has reached its goal", async () => {
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 2000, stepSize: 250 });
    findUnique.mockResolvedValue({ amount: 2000 });

    const result = await advanceHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { amount: 0 } });
    expect(remove).toHaveBeenCalled();
  });

  it("only looks up the user's own active habits", async () => {
    await advanceHabit({ habitId: "h1" });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "h1", userId: "u1", archivedAt: null },
      }),
    );
  });

  it("rejects a habit that is not found", async () => {
    findFirst.mockResolvedValue(null);

    expect(await advanceHabit({ habitId: "other" })).toEqual({
      success: false,
      error: "Habit not found",
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    expect(await advanceHabit({ habitId: "" })).toEqual({
      success: false,
      error: "Invalid habit",
    });
    expect(getSessionUser).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    getSessionUser.mockResolvedValue(null);

    expect(await advanceHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Not signed in",
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("reports a failed write without revalidating", async () => {
    upsert.mockRejectedValue(new Error("db down"));

    expect(await advanceHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Could not save, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("createHabit", () => {
  const input = {
    name: "Read",
    description: "10 pages",
    categoryId: "c1",
    frequency: "WEEKLY" as const,
    targetDaysPerWeek: 3,
    icon: "📚" as const,
    color: "sky" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({
      id: "u1",
      timezone: "Pacific/Auckland",
    });
    findCategory.mockResolvedValue({ id: "c1" });
    createHabitRow.mockResolvedValue({ id: "h9" });
  });

  it("creates a custom habit with its first target, starting on the user's local Monday", async () => {
    const result = await createHabit(input);

    expect(result).toEqual({ success: true, data: { id: "h9" } });
    // Wednesday 2026-10-14 in Auckland: that week starts on Monday the 12th
    expect(createHabitRow).toHaveBeenCalledWith({
      data: {
        name: "Read",
        description: "10 pages",
        categoryId: "c1",
        icon: "📚",
        color: "sky",
        dailyGoal: null,
        unit: null,
        stepSize: null,
        userId: "u1",
        targets: {
          create: {
            frequency: "WEEKLY",
            targetDaysPerWeek: 3,
            effectiveFrom: new Date("2026-10-12T00:00:00.000Z"),
          },
        },
      },
      select: { id: true },
    });
    expect(createHabitRow.mock.calls[0][0].data).not.toHaveProperty(
      "systemHabitId",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/today");
    expect(revalidatePath).toHaveBeenCalledWith("/habits");
  });

  it("always stores a daily habit as seven days", async () => {
    await createHabit({ ...input, frequency: "DAILY", targetDaysPerWeek: 2 });

    const target = createHabitRow.mock.calls[0][0].data.targets.create;
    expect(target).toMatchObject({ frequency: "DAILY", targetDaysPerWeek: 7 });
  });

  it("rejects invalid input with the first message, before checking the session", async () => {
    expect(await createHabit({ ...input, name: " " })).toEqual({
      success: false,
      error: "Give your habit a name",
    });
    expect(getSessionUser).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    getSessionUser.mockResolvedValue(null);

    expect(await createHabit(input)).toEqual({
      success: false,
      error: "Not signed in",
    });
    expect(createHabitRow).not.toHaveBeenCalled();
  });

  describe("from the catalog", () => {
    const catalogInput = { ...input, icon: "🥤", systemHabitId: "s1" };

    beforeEach(() => {
      findSystemHabit.mockResolvedValue({ id: "s1" });
      findFirst.mockResolvedValue(null);
    });

    it("links the system habit and stores the goal from the form", async () => {
      const result = await createHabit({
        ...catalogInput,
        dailyGoal: 2000,
        unit: "ml",
        stepSize: 250,
      });

      expect(result).toEqual({ success: true, data: { id: "h9" } });
      expect(createHabitRow.mock.calls[0][0].data).toMatchObject({
        icon: "🥤",
        systemHabitId: "s1",
        dailyGoal: 2000,
        unit: "ml",
        stepSize: 250,
      });
    });

    it("rejects a system habit that does not exist", async () => {
      findSystemHabit.mockResolvedValue(null);

      expect(await createHabit(catalogInput)).toEqual({
        success: false,
        error: "Habit not found",
      });
      expect(createHabitRow).not.toHaveBeenCalled();
    });

    it("rejects a habit the user already has", async () => {
      findFirst.mockResolvedValue({ id: "h1" });

      expect(await createHabit(catalogInput)).toEqual({
        success: false,
        error: "You already added this habit",
      });
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "u1", systemHabitId: "s1", archivedAt: null },
        }),
      );
      expect(createHabitRow).not.toHaveBeenCalled();
    });
  });

  it("rejects a category that does not exist", async () => {
    findCategory.mockResolvedValue(null);

    expect(await createHabit(input)).toEqual({
      success: false,
      error: "Category not found",
    });
    expect(createHabitRow).not.toHaveBeenCalled();
  });

  it("reports a failed write without revalidating", async () => {
    createHabitRow.mockRejectedValue(new Error("db down"));

    expect(await createHabit(input)).toEqual({
      success: false,
      error: "Could not create the habit, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
