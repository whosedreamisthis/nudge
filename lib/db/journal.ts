import { cacheLife, cacheTag } from "next/cache";
import { journalTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { fromDbDate, toDbDate, type DateKey } from "@/lib/dates";
import { monthRange, type HistoryFilters } from "@/lib/journal";

// Entries cleared down to nothing stay in the table but are not worth showing
const NOT_EMPTY = { OR: [{ content: { not: "" } }, { mood: { not: null } }] };

// The day's entries, newest first
// Not cached: the editors start from these, so they must never be stale
export function getEntriesForDay(userId: string, day: DateKey) {
  return prisma.journalEntry.findMany({
    where: { userId, date: toDbDate(day), ...NOT_EMPTY },
    select: { id: true, content: true, mood: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

// One of the user's entries, or null when it doesn't exist or belongs to someone else
// Not cached, for the same reason
export async function getEntryById(userId: string, id: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId },
    select: { id: true, date: true, content: true, mood: true, createdAt: true },
  });
  return entry && { ...entry, date: fromDbDate(entry.date) };
}

// Past entries, newest first, narrowed by the History filters. One extra row is read to know
// whether "Show more" has anything to show.
export function getHistory(userId: string, filters: HistoryFilters) {
  // Every search text would be its own entry, so searches are read straight from the database
  return filters.q ? readHistory(userId, filters) : getCachedHistory(userId, filters);
}

async function getCachedHistory(userId: string, filters: HistoryFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag(journalTag(userId));

  return readHistory(userId, filters);
}

async function readHistory(userId: string, { q, month, mood, limit }: HistoryFilters) {
  const range = month ? monthRange(month) : null;
  const rows = await prisma.journalEntry.findMany({
    where: {
      userId,
      AND: [
        NOT_EMPTY,
        ...(q ? [{ content: { contains: q, mode: "insensitive" as const } }] : []),
      ],
      ...(mood && { mood }),
      ...(range && { date: { gte: toDbDate(range.from), lt: toDbDate(range.to) } }),
    },
    select: { id: true, date: true, content: true, mood: true, createdAt: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
  });

  return {
    entries: rows.slice(0, limit).map((row) => ({ ...row, date: fromDbDate(row.date) })),
    hasMore: rows.length > limit,
  };
}

// The months that have an entry, newest first, for the month filter
export async function getEntryMonths(userId: string): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(journalTag(userId));

  const rows = await prisma.journalEntry.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  return [...new Set(rows.map((row) => fromDbDate(row.date).slice(0, 7)))];
}
