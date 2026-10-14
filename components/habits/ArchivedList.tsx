import { ArchivedHabitActions } from "@/components/habits/ArchivedHabitActions";
import type { getArchivedHabits } from "@/lib/db/archived";
import { categoryTagClass, habitTileClass } from "@/lib/habit-colors";
import { cn } from "@/lib/utils";

type ArchivedHabit = Awaited<ReturnType<typeof getArchivedHabits>>[number];

export function ArchivedList({ habits }: { habits: ArchivedHabit[] }) {
  if (habits.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No archived habits. Archive one from the menu on Today and it will wait here.
      </p>
    );
  }

  return (
    <ul className="grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2 lg:[&>li:nth-child(2)]:border-t-0 lg:[&>li:nth-child(odd)]:border-r lg:[&>li:nth-child(odd)]:border-border">
      {habits.map((habit) => (
        <li key={habit.id} className="flex items-center gap-3 p-3">
          <span
            aria-hidden
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl",
              habitTileClass(habit.color),
            )}
          >
            {habit.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{habit.name}</p>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                categoryTagClass(habit.category.name),
              )}
            >
              {habit.category.name}
            </span>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>
          </div>
          <ArchivedHabitActions
            habitId={habit.id}
            habitName={habit.name}
            isCustom={habit.systemHabitId === null}
          />
        </li>
      ))}
    </ul>
  );
}
