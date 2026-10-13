import { Check, Flame } from "lucide-react";
import { HabitMenu } from "@/components/today/HabitMenu";
import { categoryTagClass, habitProgressClass, habitTileClass } from "@/lib/habit-colors";
import { describeStreak, formatStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import type { TodayHabit } from "@/types/habits";

export function HabitRow({ habit }: { habit: TodayHabit }) {
  const { streak, progress } = habit;
  const hasStreak = streak.current > 0;
  const isMultiStep = progress.goal !== null;

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-xl p-3 text-card-foreground shadow-sm ring-1",
        progress.complete ? "bg-complete-tint ring-complete/30" : "bg-card ring-border",
      )}
    >
      <HabitMenu habitName={habit.name} />
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-xl",
          habitTileClass(habit.color),
        )}
      >
        {habit.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{habit.name}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs",
              categoryTagClass(habit.categoryName),
            )}
          >
            {habit.categoryName}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>

        {isMultiStep && (
          <div className="mt-2 flex items-center gap-2">
            <progress
              value={Math.min(progress.amount, progress.goal!)}
              max={progress.goal!}
              aria-label={`${habit.name} progress`}
              className={cn(
                "h-1.5 flex-1 appearance-none overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full",
                habitProgressClass(habit.color),
              )}
            />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {progress.amount}/{progress.goal} {habit.unit}
            </span>
          </div>
        )}

        {progress.week && (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {progress.week.done}/{progress.week.target} this week
          </p>
        )}
      </div>

      {/* Bottom-aligned so the actions ellipsis has the top-right corner to itself */}
      <div className="flex shrink-0 items-center gap-3 self-end">
        <span
          aria-label={describeStreak(streak)}
          className={cn(
            "flex shrink-0 items-center gap-1 text-sm font-medium",
            !hasStreak && "text-muted-foreground",
          )}
        >
          <Flame aria-hidden className={cn("size-4", hasStreak && "text-cat-fitness")} />
          {formatStreak(streak)}
        </span>

        {/* Shows the state only; it becomes a button with the toggle feature */}
        <span
          role="img"
          aria-label={progress.complete ? "Completed today" : "Not completed today"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
            progress.complete
              ? "border-complete bg-complete text-complete-foreground"
              : "border-muted-foreground/40",
          )}
        >
          {progress.complete && <Check aria-hidden className="size-4" strokeWidth={3} />}
        </span>
      </div>
    </li>
  );
}
