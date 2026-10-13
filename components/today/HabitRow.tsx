import { Check, Flame } from "lucide-react";
import { HabitMenu } from "@/components/today/HabitMenu";
import { categoryTagClass, habitFillClass, habitTileClass } from "@/lib/habit-colors";
import { describeStreak, formatStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import type { TodayHabit } from "@/types/habits";

export function HabitRow({ habit }: { habit: TodayHabit }) {
  const { streak, progress } = habit;
  const hasStreak = streak.current > 0;
  const isMultiStep = progress.goal !== null;
  const fillPercent = isMultiStep ? Math.min(100, (progress.amount / progress.goal!) * 100) : 0;

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-xl p-3 text-card-foreground shadow-sm ring-1",
        progress.complete ? "bg-complete-tint ring-complete/30" : "bg-card ring-border",
      )}
    >
      {isMultiStep && (
        // The whole card is the progress bar: a tint that grows from the left with the amount done
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
        >
          <div
            className={cn("h-full transition-[width]", habitFillClass(habit.color))}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      )}
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-xl",
          habitTileClass(habit.color),
        )}
      >
        {habit.icon}
      </span>

      <div className="relative min-w-0 flex-1">
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
          <p
            role="progressbar"
            aria-label={`${habit.name} progress`}
            aria-valuemin={0}
            aria-valuemax={progress.goal!}
            aria-valuenow={Math.min(progress.amount, progress.goal!)}
            className="mt-1 text-xs text-muted-foreground tabular-nums"
          >
            {progress.amount}/{progress.goal} {habit.unit}
          </p>
        )}

        {progress.week && (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {progress.week.done}/{progress.week.target} this week
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
        <div className="flex items-center gap-3">
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

        <HabitMenu habitName={habit.name} />
      </div>
    </li>
  );
}
