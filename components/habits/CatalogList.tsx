import { AddHabitButton } from "@/components/habits/AddHabitButton";
import { frequencyLabel } from "@/lib/catalog";
import type { getCatalogHabits } from "@/lib/db/catalog";
import { categoryTagClass, habitTileClass } from "@/lib/habit-colors";
import { cn } from "@/lib/utils";

type CatalogHabit = Awaited<ReturnType<typeof getCatalogHabits>>[number];

const TAG_CLASS = "rounded-full px-2 py-0.5 text-xs font-medium";

export function CatalogList({ habits, filtered }: { habits: CatalogHabit[]; filtered: boolean }) {
  if (habits.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {filtered ? "No habits match your search." : "You've added every habit in the catalog."}
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
        <section key={group.name} aria-labelledby={`catalog-${group.name}`}>
          <h2
            id={`catalog-${group.name}`}
            className="mb-2 text-sm font-semibold capitalize text-muted-foreground"
          >
            {group.name}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
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
                      className={cn(TAG_CLASS, "capitalize", categoryTagClass(habit.category.name))}
                    >
                      {habit.category.name}
                    </span>
                    <span className={cn(TAG_CLASS, "bg-muted")}>
                      {frequencyLabel(habit.defaultFrequency, habit.defaultTargetDaysPerWeek)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {habit.description}
                  </p>
                </div>
                <AddHabitButton
                  prefill={{
                    systemHabitId: habit.id,
                    name: habit.name,
                    description: habit.description,
                    icon: habit.icon,
                    categoryId: habit.categoryId,
                    frequency: habit.defaultFrequency,
                    targetDaysPerWeek: habit.defaultTargetDaysPerWeek,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
