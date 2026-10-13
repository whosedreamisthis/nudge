import { prisma } from "@/lib/db";
import { fromDbDate, type DateKey } from "@/lib/dates";
import { getTodayProgress } from "@/lib/progress";
import { getStreak } from "@/lib/streaks";
import type { TodayHabit } from "@/types/habits";

// The user's active habits with their current streaks and today's progress, oldest first
export async function getTodayHabits(userId: string, today: DateKey): Promise<TodayHabit[]> {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      category: { select: { name: true } },
      targets: true,
      completions: { select: { date: true, amount: true } },
    },
  });

  return habits.map((habit) => {
    const history = {
      completions: habit.completions.map((c) => ({ date: fromDbDate(c.date), amount: c.amount })),
      dailyGoal: habit.dailyGoal,
      targets: habit.targets.map((t) => ({
        frequency: t.frequency,
        targetDaysPerWeek: t.targetDaysPerWeek,
        effectiveFrom: fromDbDate(t.effectiveFrom),
      })),
      today,
    };

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      unit: habit.unit,
      categoryName: habit.category.name,
      streak: getStreak(history),
      progress: getTodayProgress(history),
    };
  });
}
