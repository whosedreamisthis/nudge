import { prisma } from "@/lib/db";
import { addDays, fromDbDate, toDateKey, toDbDate, type DateKey } from "@/lib/dates";
import { buildWeekGrid, type GridRow } from "@/lib/week-grid";

// The user's active habits laid out for one week (Monday to Sunday), oldest habit first.
// Only that week's completions are loaded. Every habit is listed in every week, so an early
// week is a full grid of empty cells (a habit's days before it existed show as empty).
export async function getWeekGrid(
  userId: string,
  timezone: string,
  week: DateKey,
  today: DateKey,
): Promise<GridRow[]> {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      dailyGoal: true,
      createdAt: true,
      targets: { select: { frequency: true, targetDaysPerWeek: true, effectiveFrom: true } },
      completions: {
        where: { date: { gte: toDbDate(week), lte: toDbDate(addDays(week, 6)) } },
        select: { date: true, amount: true },
      },
    },
  });

  const inputs = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    createdOn: toDateKey(habit.createdAt, timezone),
    dailyGoal: habit.dailyGoal,
    targets: habit.targets.map((t) => ({
      frequency: t.frequency,
      targetDaysPerWeek: t.targetDaysPerWeek,
      effectiveFrom: fromDbDate(t.effectiveFrom),
    })),
    completions: habit.completions.map((c) => ({ date: fromDbDate(c.date), amount: c.amount })),
  }));

  return buildWeekGrid(inputs, week, today);
}
