import { prisma } from "@/lib/db";
import { fromDbDate, toDbDate, type DateKey } from "@/lib/dates";
import {
  historyStart,
  motivationSchema,
  type HabitHistory,
  type StoredMotivation,
} from "@/lib/motivation";
import { isDayComplete } from "@/lib/streaks";

// Today's stored motivation, null when there is none yet (or the stored content is unreadable)
export async function getMotivation(
  userId: string,
  today: DateKey,
): Promise<StoredMotivation | null> {
  const row = await prisma.aiReport.findUnique({
    where: {
      userId_type_periodStart: { userId, type: "MOTIVATION", periodStart: toDbDate(today) },
    },
    select: { content: true },
  });
  if (!row) return null;

  const parsed = motivationSchema.safeParse(row.content);
  return parsed.success ? parsed.data : null;
}

// Completed days per active habit over the days before `today`
export async function getRecentHistory(userId: string, today: DateKey): Promise<HabitHistory[]> {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      dailyGoal: true,
      completions: {
        where: { date: { gte: toDbDate(historyStart(today)), lt: toDbDate(today) } },
        select: { date: true, amount: true },
      },
    },
  });

  return habits.map((habit) => ({
    name: habit.name,
    done: new Set(
      habit.completions
        .filter((c) => isDayComplete(c.amount, habit.dailyGoal))
        .map((c) => fromDbDate(c.date)),
    ).size,
  }));
}
