import { cacheLife, cacheTag } from "next/cache";
import { completionsTag, habitsTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { fromDbDate, toDbDate, type DateKey } from "@/lib/dates";
import { buildHeatmap, heatmapStart, type Heatmap } from "@/lib/consistency";
import { isDayComplete } from "@/lib/streaks";

// How many habits the user completed on each of the last 14 weeks' days, in one query.
// A habit with a daily goal counts once its goal is reached; archived habits still count,
// because those days happened.
export async function getHeatmap(userId: string, today: DateKey): Promise<Heatmap> {
  "use cache";
  cacheLife("hours");
  cacheTag(habitsTag(userId), completionsTag(userId));

  const rows = await prisma.habitCompletion.findMany({
    where: { userId, date: { gte: toDbDate(heatmapStart(today)), lte: toDbDate(today) } },
    select: { date: true, amount: true, habit: { select: { dailyGoal: true } } },
  });

  const counts = new Map<DateKey, number>();
  for (const row of rows) {
    if (!isDayComplete(row.amount, row.habit.dailyGoal)) continue;
    const date = fromDbDate(row.date);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return buildHeatmap(counts, today);
}
