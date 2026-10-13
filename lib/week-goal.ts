import type { TodayProgress } from "@/lib/progress";
import type { TodayHabit } from "@/types/habits";

// Weekly habits can be done on any day, so Today separates the ones that need nothing more this week.

// A weekly habit that has hit its target for the week
export function isWeekGoalMet({ week }: TodayProgress) {
  return week !== null && week.done >= week.target;
}

// Goal met and not done today: dimmed below the list, still tappable for a bonus day.
// Once it is done today it stays in the main list until tomorrow.
export function isOffDay(progress: TodayProgress) {
  return isWeekGoalMet(progress) && !progress.complete;
}

// Habits for the header ring: every daily habit, plus a weekly habit once it is done today.
// A weekly habit that is not done never holds the ring back, since any day will do.
export function countsTowardRing({ week, complete }: TodayProgress) {
  return week === null || complete;
}

export function getRingCounts(habits: TodayHabit[]) {
  const counted = habits.filter((habit) => countsTowardRing(habit.progress));
  return { done: counted.filter((habit) => habit.progress.complete).length, total: counted.length };
}

// Main list first, then the weekly habits that are off for today, each keeping its order
export function splitOffDay(habits: TodayHabit[]) {
  return {
    active: habits.filter((habit) => !isOffDay(habit.progress)),
    offDay: habits.filter((habit) => isOffDay(habit.progress)),
  };
}
