import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, upsert, deleteMany, revalidatePath } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { journalEntry: { upsert, deleteMany } } }));

import { deleteJournalEntry, saveJournalEntry } from "./journal";

describe("saveJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
  });

  it("upserts today's entry for the signed-in user", async () => {
    const result = await saveJournalEntry({ content: "Hello", mood: 3 });

    expect(result).toEqual({ success: true, data: null });
    const call = upsert.mock.calls[0][0];
    expect(call.where.userId_date.userId).toBe("u1");
    expect(call.update).toEqual({ content: "Hello", mood: 3 });
    expect(call.create).toMatchObject({ userId: "u1", content: "Hello", mood: 3 });
  });

  it("saves a past day when a date is given", async () => {
    await saveJournalEntry({ content: "Old", mood: null, date: "2020-01-05" });

    const call = upsert.mock.calls[0][0];
    expect(call.where.userId_date.date).toEqual(new Date("2020-01-05T00:00:00.000Z"));
  });

  it("rejects a future day", async () => {
    const result = await saveJournalEntry({ content: "Hi", mood: null, date: "2999-01-01" });

    expect(result.success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects when signed out", async () => {
    getSessionUser.mockResolvedValue(null);

    const result = await saveJournalEntry({ content: "Hello", mood: null });

    expect(result.success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid mood", async () => {
    const result = await saveJournalEntry({ content: "Hello", mood: 9 });

    expect(result.success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("reports a database failure", async () => {
    upsert.mockRejectedValue(new Error("db down"));

    const result = await saveJournalEntry({ content: "Hello", mood: null });

    expect(result).toEqual({ success: false, error: "Could not save, try again" });
  });
});

describe("deleteJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
  });

  it("deletes only the signed-in user's entry for that day", async () => {
    const result = await deleteJournalEntry({ date: "2026-10-01" });

    expect(result).toEqual({ success: true, data: null });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", date: new Date("2026-10-01T00:00:00.000Z") },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
  });

  it("rejects when signed out", async () => {
    getSessionUser.mockResolvedValue(null);

    const result = await deleteJournalEntry({ date: "2026-10-01" });

    expect(result.success).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("rejects an invalid date", async () => {
    const result = await deleteJournalEntry({ date: "not-a-date" });

    expect(result.success).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("reports a database failure", async () => {
    deleteMany.mockRejectedValue(new Error("db down"));

    const result = await deleteJournalEntry({ date: "2026-10-01" });

    expect(result).toEqual({
      success: false,
      error: "Could not delete the entry, try again",
    });
  });
});
