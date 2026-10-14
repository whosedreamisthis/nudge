import { prisma } from "@/lib/db";
import { fromDbDate, toDbDate, type DateKey } from "@/lib/dates";
import { monthRange, type HistoryFilters } from "@/lib/journal";

// The user's entry for a local day, or null when nothing is written yet
export function getEntry(userId: string, day: DateKey) {
  return prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: toDbDate(day) } },
    select: { content: true, mood: true },
  });
}

// Past entries, newest first, narrowed by the History filters. One extra row is read to know
// whether "Show more" has anything to show. Entries that were cleared to nothing are skipped.
export async function getHistory(userId: string, { q, month, mood, limit }: HistoryFilters) {
  const range = month ? monthRange(month) : null;
  const rows = await prisma.journalEntry.findMany({
    where: {
      userId,
      AND: [
        { OR: [{ content: { not: "" } }, { mood: { not: null } }] },
        ...(q ? [{ content: { contains: q, mode: "insensitive" as const } }] : []),
      ],
      ...(mood && { mood }),
      ...(range && { date: { gte: toDbDate(range.from), lt: toDbDate(range.to) } }),
    },
    select: { date: true, content: true, mood: true },
    orderBy: { date: "desc" },
    take: limit + 1,
  });

  return {
    entries: rows.slice(0, limit).map((row) => ({ ...row, date: fromDbDate(row.date) })),
    hasMore: rows.length > limit,
  };
}

// The months that have an entry, newest first, for the month filter
export async function getEntryMonths(userId: string): Promise<string[]> {
  const rows = await prisma.journalEntry.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  return [...new Set(rows.map((row) => fromDbDate(row.date).slice(0, 7)))];
}
