import { prisma } from "@/lib/db";
import { toDbDate, type DateKey } from "@/lib/dates";
import { reportSchema, type WeeklyReport } from "@/lib/ai-report";

export type StoredReport = WeeklyReport & { generatedAt: string };

// The stored weekly report for the week starting on `week`, null when there is none yet (or the
// stored content no longer matches the expected shape)
export async function getWeeklyReport(userId: string, week: DateKey): Promise<StoredReport | null> {
  const row = await prisma.aiReport.findUnique({
    where: { userId_type_periodStart: { userId, type: "WEEKLY", periodStart: toDbDate(week) } },
    select: { content: true, updatedAt: true },
  });
  if (!row) return null;

  const parsed = reportSchema.safeParse(row.content);
  return parsed.success ? { ...parsed.data, generatedAt: row.updatedAt.toISOString() } : null;
}
