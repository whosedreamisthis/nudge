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

import { advanceHabit } from "./habits";

// 2026-10-14 03:00 in Auckland is still 2026-10-13 in UTC: the local day must win
const NOW = new Date("2026-10-13T14:00:00Z");

describe("advanceHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Pacific/Auckland" });
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
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { amount: 2000 } }));
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
      expect.objectContaining({ where: { id: "h1", userId: "u1", archivedAt: null } }),
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
