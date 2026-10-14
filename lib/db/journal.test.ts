import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { journalEntry: { findMany } } }));

import { getEntryMonths, getHistory } from "./journal";

const NO_FILTERS = { q: "", month: "", mood: null, limit: 2 };

const row = (date: string, content = "text", mood: number | null = null) => ({
  date: new Date(`${date}T00:00:00.000Z`),
  content,
  mood,
});

describe("getHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns date keys, newest first, and flags more rows", async () => {
    findMany.mockResolvedValue([row("2026-10-03"), row("2026-10-02"), row("2026-10-01")]);

    const { entries, hasMore } = await getHistory("u1", NO_FILTERS);

    expect(entries.map((e) => e.date)).toEqual(["2026-10-03", "2026-10-02"]);
    expect(hasMore).toBe(true);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      orderBy: { date: "desc" },
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
