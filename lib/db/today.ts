import { prisma } from "@/lib/db";
import { fromDbDate, type DateKey } from "@/lib/dates";
import { getTodayProgress } from "@/lib/progress";
import { getTodayStats, type StatsEntry, type TodayStats } from "@/lib/stats";
import { getStreak, type StreakInput } from "@/lib/streaks";
import type { TodayHabit } from "@/types/habits";

// The user's active habits with their current streaks and today's progress (oldest first),
// plus the summary tiles, all from one query
export async function getToday(
  userId: string,
  today: DateKey,
): Promise<{ habits: TodayHabit[]; stats: TodayStats }> {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      category: { select: { name: true } },
      targets: true,
      completions: { select: { date: true, amount: true } },
    },
  });

  const entries: StatsEntry[] = [];
  const rows = habits.map((habit) => {
    const history: StreakInput = {
      completions: habit.completions.map((c) => ({
        date: fromDbDate(c.date),
        amount: c.amount,
      })),
      dailyGoal: habit.dailyGoal,
      targets: habit.targets.map((t) => ({
        frequency: t.frequency,
        targetDaysPerWeek: t.targetDaysPerWeek,
        effectiveFrom: fromDbDate(t.effectiveFrom),
      })),
      today,
    };

    entries.push({ name: habit.name, icon: habit.icon, history });

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      unit: habit.unit,
      stepSize: habit.stepSize,
      categoryName: habit.category.name,
      streak: getStreak(history),
      progress: getTodayProgress(history),
    };
  });

  return { habits: rows, stats: getTodayStats(entries) };
}
