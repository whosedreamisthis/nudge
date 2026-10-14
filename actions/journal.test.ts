import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, upsert } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("@/lib/db", () => ({ prisma: { journalEntry: { upsert } } }));

import { saveJournalEntry } from "./journal";

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
