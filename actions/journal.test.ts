import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, create, updateMany, deleteMany, revalidatePath, updateTag, revalidateTag } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag, revalidateTag }));
vi.mock("@/lib/db", () => ({
  prisma: { journalEntry: { create, updateMany, deleteMany } },
}));

import { deleteJournalEntry, saveJournalEntry } from "./journal";

describe("saveJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
  });

  it("creates a new entry for today and returns its id and time", async () => {
    const createdAt = new Date("2026-10-13T09:14:00Z");
    create.mockResolvedValue({ id: "e1", createdAt });

    const result = await saveJournalEntry({ content: "Hello", mood: 3 });

    expect(result).toEqual({
      success: true,
      data: { id: "e1", createdAt: createdAt.toISOString() },
    });
    expect(create.mock.calls[0][0].data).toMatchObject({
      userId: "u1",
      content: "Hello",
      mood: 3,
    });
  });

  it("does not create an empty entry", async () => {
    const result = await saveJournalEntry({ content: "  \n", mood: null });

    expect(result).toEqual({ success: true, data: null });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates an entry with only a mood", async () => {
    create.mockResolvedValue({ id: "e1", createdAt: new Date() });

    await saveJournalEntry({ content: "", mood: 5 });

    expect(create).toHaveBeenCalledOnce();
  });

  it("updates an existing entry, scoped to the user", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    const result = await saveJournalEntry({ id: "e1", content: "Edited", mood: 2 });

    expect(result).toEqual({ success: true, data: null });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "e1", userId: "u1" },
      data: { content: "Edited", mood: 2 },
    });
    expect(create).not.toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith("user:u1:journal", "max");
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("keeps an existing entry that was cleared to nothing", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await saveJournalEntry({ id: "e1", content: "", mood: null });

    expect(updateMany).toHaveBeenCalledOnce();
  });

  it("fails for an entry that isn't the user's", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await saveJournalEntry({ id: "other", content: "Hi", mood: null });

    expect(result).toEqual({ success: false, error: "Entry not found" });
  });

  it("rejects when signed out", async () => {
    getSessionUser.mockResolvedValue(null);

    const result = await saveJournalEntry({ content: "Hello", mood: null });

    expect(result.success).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an invalid mood", async () => {
    const result = await saveJournalEntry({ content: "Hello", mood: 9 });

    expect(result.success).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("reports a database failure", async () => {
    create.mockRejectedValue(new Error("db down"));

    const result = await saveJournalEntry({ content: "Hello", mood: null });

    expect(result).toEqual({ success: false, error: "Could not save, try again" });
  });
});

describe("deleteJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });
  });

  it("deletes only the signed-in user's entry", async () => {
    const result = await deleteJournalEntry({ id: "e1" });

    expect(result).toEqual({ success: true, data: null });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "e1", userId: "u1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
    expect(updateTag).toHaveBeenCalledWith("user:u1:journal");
  });

  it("rejects when signed out", async () => {
    getSessionUser.mockResolvedValue(null);

    const result = await deleteJournalEntry({ id: "e1" });

    expect(result.success).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("rejects an empty id", async () => {
    const result = await deleteJournalEntry({ id: "" });

    expect(result.success).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("reports a database failure", async () => {
    deleteMany.mockRejectedValue(new Error("db down"));

    const result = await deleteJournalEntry({ id: "e1" });

    expect(result).toEqual({
      success: false,
      error: "Could not delete the entry, try again",
    });
  });
});
