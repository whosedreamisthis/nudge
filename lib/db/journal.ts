import { prisma } from "@/lib/db";
import { toDbDate, type DateKey } from "@/lib/dates";

// The user's entry for a local day, or null when nothing is written yet
export function getEntry(userId: string, day: DateKey) {
  return prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: toDbDate(day) } },
    select: { content: true, mood: true },
  });
}
