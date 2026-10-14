import { addDays, weekDays, weekStart, type DateKey } from "@/lib/dates";
import {
  completedDays,
  targetForWeek,
  type Completion,
  type StreakTarget,
} from "@/lib/streaks";

// Pure functions over plain data: callers load the habits and their completions for one week.

export type GridHabitInput = {
  id: string;
  name: string;
  icon: string;
  color: string;
  // The user-local day the habit was created: earlier days are not part of its story
  createdOn: DateKey;
  dailyGoal: number | null;
  targets: StreakTarget[];
  // Only the days of the shown week are needed
  completions: Completion[];
};

// "done" is a completed day; "open" a day that could have been done and was not (not a miss
// for a weekly habit, which only needs its target); "future" has not happened; "before" is
// from before the habit existed
export type DayState = "done" | "open" | "future" | "before";

export type GridRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: { date: DateKey; state: DayState }[];
  // Completed days this week against the target (7 for a daily habit)
  done: number;
  target: number;
  met: boolean;
};

export function buildWeekGrid(habits: GridHabitInput[], week: DateKey, today: DateKey): GridRow[] {
  const days = weekDays(week);

  return habits.map((habit) => {
    const complete = completedDays(habit.completions, habit.dailyGoal);
    const done = days.filter((date) => complete.has(date)).length;
    const target = targetForWeek(habit.targets, week)?.targetDaysPerWeek ?? 7;

    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      days: days.map((date) => ({
        date,
        state: complete.has(date)
          ? "done"
          : date < habit.createdOn
            ? "before"
            : date > today
              ? "future"
              : "open",
      })),
      done,
      target,
      met: done >= target,
    };
  });
}

// The habit with the most completed days in the week, null when nothing was completed.
// The first one wins a tie, so the order the habits come in decides.
export function topHabit(rows: GridRow[]): GridRow | null {
  let top: GridRow | null = null;
  for (const row of rows) {
    if (row.done > 0 && (!top || row.done > top.done)) top = row;
  }
  return top;
}

// The Monday to show from the ?week= param: this week unless it names an earlier, real day
export function resolveWeek(param: string | undefined, today: DateKey): DateKey {
  const thisWeek = weekStart(today);
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param) || addDays(param, 0) !== param) {
    return thisWeek;
  }
  const week = weekStart(param);
  return week > thisWeek ? thisWeek : week;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Oct 12 – 18, 2026", "Oct 26 – Nov 1, 2026" or "Dec 29, 2025 – Jan 4, 2026"
export function weekRangeLabel(week: DateKey): string {
  const end = addDays(week, 6);
  const [y1, m1, d1] = week.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);

  if (y1 !== y2) return `${MONTHS[m1 - 1]} ${d1}, ${y1} – ${MONTHS[m2 - 1]} ${d2}, ${y2}`;
  if (m1 !== m2) return `${MONTHS[m1 - 1]} ${d1} – ${MONTHS[m2 - 1]} ${d2}, ${y1}`;
  return `${MONTHS[m1 - 1]} ${d1} – ${d2}, ${y1}`;
}
