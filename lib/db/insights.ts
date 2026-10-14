import { prisma } from "@/lib/db";
import { fromDbDate, toDbDate, type DateKey } from "@/lib/dates";
import { buildInsights, insightsStart, type Insights } from "@/lib/insights";
import { isDayComplete } from "@/lib/streaks";

// The user's completions for the last 60 days in one query (the last 30 days and the 30 before,
// which also cover the two chart weeks). A habit with a daily goal counts once its goal is
// reached; archived habits still count, because those days happened.
export async function getInsights(userId: string, today: DateKey): Promise<Insights> {
  const rows = await prisma.habitCompletion.findMany({
    where: { userId, date: { gte: toDbDate(insightsStart(today)), lte: toDbDate(today) } },
    select: { date: true, amount: true, habit: { select: { dailyGoal: true } } },
  });

  const counts = new Map<DateKey, number>();
  for (const row of rows) {
    if (!isDayComplete(row.amount, row.habit.dailyGoal)) continue;
    const date = fromDbDate(row.date);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return buildInsights(counts, today);
}
