import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findFirst } = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { journalEntry: { findMany, findFirst } } }));

import { getEntriesForDay, getEntryById, getEntryMonths, getHistory } from "./journal";

const NO_FILTERS = { q: "", month: "", mood: null, limit: 2 };

const row = (date: string, content = "text", mood: number | null = null) => ({
  id: `id-${date}`,
  date: new Date(`${date}T00:00:00.000Z`),
  createdAt: new Date(`${date}T09:00:00.000Z`),
  content,
  mood,
});

describe("getEntriesForDay", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the user's entries for the day, newest first", async () => {
    findMany.mockResolvedValue([]);

    await getEntriesForDay("u1", "2026-10-13");

    const call = findMany.mock.calls[0][0];
    expect(call.where).toMatchObject({
      userId: "u1",
      date: new Date("2026-10-13T00:00:00.000Z"),
    });
    expect(call.orderBy).toEqual({ createdAt: "desc" });
  });
});

describe("getEntryById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes the lookup to the user and returns a date key", async () => {
    findFirst.mockResolvedValue(row("2026-10-13"));

    const entry = await getEntryById("u1", "e1");

    expect(findFirst.mock.calls[0][0].where).toEqual({ id: "e1", userId: "u1" });
    expect(entry?.date).toBe("2026-10-13");
  });

  it("returns null for someone else's or a missing entry", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getEntryById("u1", "nope")).toBeNull();
  });
});

describe("getHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns date keys, newest first, and flags more rows", async () => {
    findMany.mockResolvedValue([row("2026-10-03"), row("2026-10-02"), row("2026-10-01")]);

    const { entries, hasMore } = await getHistory("u1", NO_FILTERS);

    expect(entries.map((e) => e.date)).toEqual(["2026-10-03", "2026-10-02"]);
    expect(hasMore).toBe(true);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
  });

  it("has no more rows when the page isn't full", async () => {
    findMany.mockResolvedValue([row("2026-10-03")]);

    const { hasMore } = await getHistory("u1", NO_FILTERS);

    expect(hasMore).toBe(false);
  });

  it("scopes to the user and applies the filters", async () => {
    findMany.mockResolvedValue([]);

    await getHistory("u1", { q: "rain", month: "2026-10", mood: 4, limit: 30 });

    const { where } = findMany.mock.calls[0][0];
    expect(where.userId).toBe("u1");
    expect(where.mood).toBe(4);
    expect(where.date).toEqual({
      gte: new Date("2026-10-01T00:00:00.000Z"),
      lt: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(where.AND).toContainEqual({
      content: { contains: "rain", mode: "insensitive" },
    });
  });
});

describe("getEntryMonths", () => {
  it("lists each month once, newest first", async () => {
    findMany.mockResolvedValue([row("2026-10-03"), row("2026-10-01"), row("2026-08-20")]);

    expect(await getEntryMonths("u1")).toEqual(["2026-10", "2026-08"]);
  });
});
