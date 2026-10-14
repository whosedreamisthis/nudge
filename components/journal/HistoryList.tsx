import Link from "next/link";
import { courier } from "@/components/journal/courier";
import {
  MOODS,
  formatShortDate,
  formatEntryTime,
  groupByMonth,
  previewText,
} from "@/lib/journal";
import type { getHistory } from "@/lib/db/journal";

type History = Awaited<ReturnType<typeof getHistory>>;

// Past entries newest first, one heading per month; each row opens the full entry
export function HistoryList({
  entries,
  hasMore,
  filtered,
  nextHref,
  timezone,
}: History & { filtered: boolean; nextHref: string; timezone: string }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {filtered
          ? "No entries match your search."
          : "No entries yet. Write one on the Today tab and it will show up here."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByMonth(entries).map((group) => (
        <section key={group.month} aria-labelledby={`month-${group.month}`}>
          <h2
            id={`month-${group.month}`}
            className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {group.label}
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {group.entries.map((entry) => {
              const mood = MOODS.find((m) => m.value === entry.mood);
              const preview = previewText(entry.content);
              return (
                <li key={entry.id}>
                  <Link
                    href={`/journal/${entry.id}`}
                    className="flex items-start gap-3 py-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center text-2xl"
                      role={mood ? "img" : undefined}
                      aria-label={mood ? `Mood: ${mood.label}` : undefined}
                      aria-hidden={mood ? undefined : true}
                    >
                      {mood?.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      {/* Date on the left, time on the right */}
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold">{formatShortDate(entry.date)}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatEntryTime(entry.createdAt, timezone)}
                        </span>
                      </span>
                      <span
                        className={`${courier.className} mt-0.5 line-clamp-2 block text-sm text-muted-foreground`}
                      >
                        {preview || "No text"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {hasMore && (
        <Link
          href={nextHref}
          scroll={false}
          className="self-center rounded-sm px-4 py-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Show more
        </Link>
      )}
    </div>
  );
}
