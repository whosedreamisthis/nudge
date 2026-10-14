import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, findFirst, findUnique, upsert, remove, revalidatePath } = vi.hoisted(
  () => ({
    getSessionUser: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
    revalidatePath: vi.fn(),
  }),
);

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    habit: { findFirst },
    habitCompletion: { findUnique, upsert, delete: remove },
  },
}));

import { completeHabitFromFocus } from "./habits";

// 2026-10-14 03:00 in Auckland: the local day is the 14th, though it is still the 13th in UTC
const NOW = new Date("2026-10-13T14:00:00Z");
const day = new Date("2026-10-14T00:00:00.000Z");

describe("completeHabitFromFocus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Pacific/Auckland" });
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: null, stepSize: null, unit: null });
    findUnique.mockResolvedValue(null);
  });

  it("marks a simple habit done for the user's local today", async () => {
    const result = await completeHabitFromFocus({ habitId: "h1", minutes: 20 });

    expect(result).toEqual({ success: true, data: { amount: 1 } });
    expect(upsert).toHaveBeenCalledWith({
      where: { habitId_date: { habitId: "h1", date: day } },
      update: { amount: 1 },
      create: { habitId: "h1", userId: "u1", date: day, amount: 1 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
  });

  it("keeps an already done habit done instead of toggling it off", async () => {
    findUnique.mockResolvedValue({ amount: 1 });

    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 20 })).toEqual({
      success: true,
      data: { amount: 1 },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("adds the session minutes to a minutes goal", async () => {
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 30, stepSize: 10, unit: "min" });
    findUnique.mockResolvedValue({ amount: 10 });

    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 20 })).toEqual({
      success: true,
      data: { amount: 30 },
    });
  });

  it("fills a goal in another unit", async () => {
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 8, stepSize: 1, unit: "glasses" });

    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 20 })).toEqual({
      success: true,
      data: { amount: 8 },
    });
  });

  it("only touches the user's own active habits", async () => {
    await completeHabitFromFocus({ habitId: "h1", minutes: 20 });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "h1", userId: "u1", archivedAt: null } }),
    );
  });

  it("fails for a missing habit, a signed-out user and bad input", async () => {
    findFirst.mockResolvedValue(null);
    expect(await completeHabitFromFocus({ habitId: "gone", minutes: 5 })).toEqual({
      success: false,
      error: "Habit not found",
    });

    getSessionUser.mockResolvedValue(null);
    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 5 })).toEqual({
      success: false,
      error: "Not signed in",
    });

    expect(await completeHabitFromFocus({ habitId: "", minutes: 5 })).toMatchObject({ success: false });
    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 0 })).toMatchObject({ success: false });
    expect(await completeHabitFromFocus({ habitId: "h1", minutes: 181 })).toMatchObject({ success: false });
    expect(upsert).not.toHaveBeenCalled();
  });
});
