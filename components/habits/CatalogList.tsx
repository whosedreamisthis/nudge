import { ChevronDown } from "lucide-react";
import { AddHabitButton } from "@/components/habits/AddHabitButton";
import { RestoreHabitButton } from "@/components/habits/RestoreHabitButton";
import { frequencyLabel } from "@/lib/catalog";
import type { getCatalogHabits } from "@/lib/db/catalog";
import { categoryTagClass, habitTileClass } from "@/lib/habit-colors";
import { cn } from "@/lib/utils";

type CatalogHabit = Awaited<ReturnType<typeof getCatalogHabits>>[number];

const TAG_CLASS = "rounded-full px-2 py-0.5 text-xs font-medium";

export function CatalogList({
  habits,
  filtered,
}: {
  habits: CatalogHabit[];
  filtered: boolean;
}) {
  if (habits.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {filtered
          ? "No habits match your search."
          : "You've added every habit in the catalog."}
      </p>
    );
  }

  // The query sorts by category, so each category is one run of rows
  const groups: { name: string; habits: CatalogHabit[] }[] = [];
  for (const habit of habits) {
    const last = groups[groups.length - 1];
    if (last?.name === habit.category.name) last.habits.push(habit);
    else groups.push({ name: habit.category.name, habits: [habit] });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        // Native details: collapses without JavaScript. The key remounts it open when a filter starts or ends.
        <details
          key={`${group.name}-${filtered}`}
          open
          className="group/category"
        >
          <summary className="mb-2 flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-semibold capitalize text-muted-foreground outline-none select-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform group-not-open/category:-rotate-90"
            />
            {group.name}
            <span className="font-normal tabular-nums">
              · {group.habits.length}
            </span>
          </summary>
          <ul className="grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2 lg:[&>li:nth-child(2)]:border-t-0 lg:[&>li:nth-child(odd)]:border-r lg:[&>li:nth-child(odd)]:border-border">
            {group.habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-3 p-3">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl",
                    habitTileClass("indigo"),
                  )}
                >
                  {habit.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{habit.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        TAG_CLASS,
                        "capitalize",
                        categoryTagClass(habit.category.name),
                      )}
                    >
                      {habit.category.name}
                    </span>
                    <span className={cn(TAG_CLASS, "bg-muted")}>
                      {frequencyLabel(
                        habit.defaultFrequency,
                        habit.defaultTargetDaysPerWeek,
                      )}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {habit.description}
                  </p>
                </div>
                {habit.habits[0] ? (
                  <RestoreHabitButton
                    habitId={habit.habits[0].id}
                    habitName={habit.name}
                  />
                ) : (
                  <AddHabitButton
                    prefill={{
                      systemHabitId: habit.id,
                      name: habit.name,
                      description: habit.description,
                      icon: habit.icon,
                      categoryId: habit.categoryId,
                      frequency: habit.defaultFrequency,
                      targetDaysPerWeek: habit.defaultTargetDaysPerWeek,
                      dailyGoal: habit.defaultDailyGoal,
                      unit: habit.defaultUnit,
                      stepSize: habit.defaultStepSize,
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
