import { prisma } from "@/lib/db";
import { fromDbDate, weekStart, type DateKey } from "@/lib/dates";
import { getTodayProgress } from "@/lib/progress";
import { getStreak, targetForWeek, type StreakInput } from "@/lib/streaks";
import type { TodayHabit } from "@/types/habits";

// The user's active habits with their current streaks and today's progress (oldest first),
// from one query
export async function getToday(
  userId: string,
  today: DateKey,
): Promise<{ habits: TodayHabit[] }> {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      category: { select: { name: true } },
      targets: true,
      completions: { select: { date: true, amount: true } },
    },
  });

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

    const target = targetForWeek(history.targets, weekStart(today));

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      unit: habit.unit,
      stepSize: habit.stepSize,
      categoryName: habit.category.name,
      categoryId: habit.categoryId,
      isCustom: habit.systemHabitId === null,
      frequency: target?.frequency ?? "DAILY",
      targetDaysPerWeek: target?.targetDaysPerWeek ?? 7,
      streak: getStreak(history),
      progress: getTodayProgress(history),
    };
  });

  return { habits: rows };
}
