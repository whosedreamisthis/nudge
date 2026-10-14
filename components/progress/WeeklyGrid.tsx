import { Check } from "lucide-react";
import Link from "next/link";
import type { DateKey } from "@/lib/dates";
import { habitSolidClass, habitTileClass } from "@/lib/habit-colors";
import type { DayState, GridRow } from "@/lib/week-grid";
import { cn } from "@/lib/utils";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const STATE_CLASSES: Record<Exclude<DayState, "done">, string> = {
  open: "bg-muted",
  future: "bg-muted/40",
  before: "bg-muted/25",
};

const STATE_LABELS: Record<DayState, string> = {
  done: "Done",
  open: "Not done",
  future: "Not yet",
  before: "Before the habit started",
};

// Habits down the side, Monday to Sunday across; a completed day is filled in the habit's colour.
// A weekly habit's unchecked days are plain, not misses: its row ends in done/target instead.
export function WeeklyGrid({
  rows,
  today,
  isCurrentWeek,
}: {
  rows: GridRow[];
  today: DateKey;
  isCurrentWeek: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No habits to show for this week.{" "}
        <Link href="/habits" className="underline underline-offset-2">
          Browse habits
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border">
      <table className="w-full table-fixed border-separate border-spacing-y-1.5">
        <caption className="sr-only">Habits completed each day this week</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[38%] text-left text-xs font-medium text-muted-foreground">
              <span className="sr-only">Habit</span>
            </th>
            {rows[0].days.map(({ date }, i) => (
              <th
                key={date}
                scope="col"
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  isCurrentWeek && date === today && "text-foreground",
                )}
              >
                <span aria-hidden>{DAY_LETTERS[i]}</span>
                <span className="sr-only">
                  {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
                    weekday: "long",
                    timeZone: "UTC",
                  })}
                </span>
              </th>
            ))}
            <th scope="col" className="w-10 text-right text-xs font-medium text-muted-foreground">
              <span className="sr-only">Completed</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="pr-2 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-base",
                      habitTileClass(row.color),
                    )}
                  >
                    {row.icon}
                  </span>
                  <span className="truncate text-sm font-medium">{row.name}</span>
                </span>
              </th>
              {row.days.map(({ date, state }) => (
                <td key={date} className="px-0.5">
                  <span
                    title={`${STATE_LABELS[state]}, ${date}`}
                    className={cn(
                      "mx-auto flex aspect-square w-full max-w-7 items-center justify-center rounded-md",
                      state === "done" ? habitSolidClass(row.color) : STATE_CLASSES[state],
                    )}
                  >
                    {state === "done" && <Check aria-hidden className="size-3.5 text-white" />}
                    <span className="sr-only">{STATE_LABELS[state]}</span>
                  </span>
                </td>
              ))}
              <td
                className={cn(
                  "text-right text-xs tabular-nums",
                  row.met ? "font-semibold text-complete" : "text-muted-foreground",
                )}
              >
                {row.done}/{row.target}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
