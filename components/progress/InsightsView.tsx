import { CircleCheck } from "lucide-react";
import { Tile } from "@/components/today/StatTiles";
import { formatLongDate } from "@/lib/dates";
import { habitSolidClass } from "@/lib/habit-colors";
import type { ChartDay, HabitPerformance, Insights } from "@/lib/insights";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function describe(day: ChartDay) {
  return `${formatLongDate(day.date)}: ${day.count === 1 ? "1 habit" : `${day.count} habits`} completed`;
}

// "+12 vs the 30 days before"; nothing to compare against when the period before was empty
function changeCaption(current: number, previous: number) {
  if (previous === 0) return "completions";
  const diff = current - previous;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  return `${sign}${Math.abs(diff)} vs the 30 days before`;
}

// Plain CSS bars: this week against last week, one pair of bars per weekday
function WeekChart({ thisWeek, lastWeek }: Pick<Insights, "thisWeek" | "lastWeek">) {
  const max = Math.max(1, ...thisWeek.map((d) => d.count), ...lastWeek.map((d) => d.count));
  const bar = (day: ChartDay, className: string) => (
    <div
      title={describe(day)}
      className={`w-full max-w-5 rounded-t-md ${className}`}
      // A day with completions always shows at least a sliver
      style={{ height: day.count > 0 ? `max(4px, ${(day.count / max) * 100}%)` : "2px" }}
    />
  );

  return (
    <section
      aria-labelledby="compare-heading"
      className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="compare-heading" className="text-sm font-medium text-foreground/75">
          This week vs last week
        </h2>
        <div aria-hidden className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/30" /> Last week
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" /> This week
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {thisWeek.map((day, i) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <div
              role="img"
              aria-label={`${describe(day)}; last week ${lastWeek[i].count}`}
              className="flex h-40 w-full items-end justify-center gap-1"
            >
              {bar(lastWeek[i], "bg-primary/30")}
              {bar(day, "bg-primary")}
            </div>
            <span aria-hidden className="text-xs text-muted-foreground">
              {DAY_LETTERS[i]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Performance({ habits }: { habits: HabitPerformance[] }) {
  return (
    <section
      aria-labelledby="performance-heading"
      className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
    >
      <h2 id="performance-heading" className="text-sm font-medium text-foreground/75">
        Habit performance
      </h2>

      {habits.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No habits to show for this week.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {habits.map((habit) => (
            <li key={habit.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{habit.icon}</span>
                  <span className="truncate font-medium">{habit.name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {habit.done}/{habit.target} · {habit.percent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${habit.name} this week`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={habit.percent}
                className="h-2 overflow-hidden rounded-full bg-border/60"
              >
                <div
                  className={`h-full rounded-full ${habitSolidClass(habit.color)}`}
                  style={{ width: `${habit.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function InsightsView({
  insights,
  performance,
}: {
  insights: Insights;
  performance: HabitPerformance[];
}) {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 xl:max-w-4xl">
      <dl aria-label="Your insights">
        <Tile
          label="Last 30 days"
          tint="bg-tint-green"
          badge={<CircleCheck className="size-5 text-complete" />}
          value={insights.last30}
          caption={changeCaption(insights.last30, insights.previous30)}
        />
      </dl>
      <WeekChart thisWeek={insights.thisWeek} lastWeek={insights.lastWeek} />
      <Performance habits={performance} />
    </div>
  );
}
