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
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({
  prisma: {
    habit: { findFirst },
    habitCompletion: { findUnique, upsert, delete: remove },
  },
}));

import { setHabitAmount, undoHabit } from "./habits";

// 2026-10-14 03:00 in Auckland: the local day is the 14th, though it is still the 13th in UTC
const NOW = new Date("2026-10-13T14:00:00Z");
const day = new Date("2026-10-14T00:00:00.000Z");

describe("undoHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Pacific/Auckland" });
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 2000, stepSize: 250 });
    findUnique.mockResolvedValue({ amount: 750 });
  });

  it("takes one step back for the user's local today", async () => {
    const result = await undoHabit({ habitId: "h1" });

    expect(result).toEqual({ success: true, data: { amount: 500 } });
    expect(upsert).toHaveBeenCalledWith({
      where: { habitId_date: { habitId: "h1", date: day } },
      update: { amount: 500 },
      create: { habitId: "h1", userId: "u1", date: day, amount: 500 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/today");
  });

  it("deletes the completion when the last step is undone", async () => {
    findUnique.mockResolvedValue({ amount: 250 });

    expect(await undoHabit({ habitId: "h1" })).toEqual({ success: true, data: { amount: 0 } });
    expect(remove).toHaveBeenCalledWith({ where: { habitId_date: { habitId: "h1", date: day } } });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("does nothing when there is nothing to undo", async () => {
    findUnique.mockResolvedValue(null);

    expect(await undoHabit({ habitId: "h1" })).toEqual({ success: true, data: { amount: 0 } });
    expect(remove).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("only touches the user's own active habits", async () => {
    await undoHabit({ habitId: "h1" });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "h1", userId: "u1", archivedAt: null } }),
    );
  });

  it("rejects an unknown habit, a signed-out user and bad input", async () => {
    findFirst.mockResolvedValue(null);
    expect(await undoHabit({ habitId: "h1" })).toEqual({
      success: false,
      error: "Habit not found",
    });

    getSessionUser.mockResolvedValue(null);
    expect(await undoHabit({ habitId: "h1" })).toEqual({ success: false, error: "Not signed in" });

    expect(await undoHabit({ habitId: "" })).toEqual({ success: false, error: "Invalid habit" });
  });
});

describe("setHabitAmount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Pacific/Auckland" });
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: 2000, stepSize: 250 });
    findUnique.mockResolvedValue(null);
  });

  it("saves the exact amount, which may pass the goal", async () => {
    const result = await setHabitAmount({ habitId: "h1", amount: 2600 });

    expect(result).toEqual({ success: true, data: { amount: 2600 } });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { amount: 2600 } }));
  });

  it("removes the completion when set to 0", async () => {
    findUnique.mockResolvedValue({ amount: 1500 });

    expect(await setHabitAmount({ habitId: "h1", amount: 0 })).toEqual({
      success: true,
      data: { amount: 0 },
    });
    expect(remove).toHaveBeenCalled();
  });

  it("refuses a habit without a daily goal", async () => {
    findFirst.mockResolvedValue({ id: "h1", dailyGoal: null, stepSize: null });

    expect(await setHabitAmount({ habitId: "h1", amount: 3 })).toEqual({
      success: false,
      error: "This habit has no daily goal",
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid amount before checking the session", async () => {
    expect(await setHabitAmount({ habitId: "h1", amount: -5 })).toEqual({
      success: false,
      error: "Enter 0 or more",
    });
    expect(getSessionUser).not.toHaveBeenCalled();
  });

  it("reports a failed write without revalidating", async () => {
    upsert.mockRejectedValue(new Error("db down"));

    expect(await setHabitAmount({ habitId: "h1", amount: 500 })).toEqual({
      success: false,
      error: "Could not save, try again",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
