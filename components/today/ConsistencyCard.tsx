import { HEATMAP_WEEKS, type HeatLevel, type Heatmap } from "@/lib/consistency";
import { formatLongDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

// Tailwind only generates classes it can see written out, so every step is spelled in full
const LEVEL_CLASSES: Record<HeatLevel, string> = {
  0: "bg-heat-0",
  1: "bg-heat-1",
  2: "bg-heat-2",
  3: "bg-heat-3",
  4: "bg-heat-4",
};

const LEVELS: HeatLevel[] = [0, 1, 2, 3, 4];

function describeDay(date: string, count: number) {
  return `${formatLongDate(date)}: ${count === 1 ? "1 habit" : `${count} habits`} completed`;
}

export function ConsistencyCard({ heatmap }: { heatmap: Heatmap }) {
  const { weeks, total } = heatmap;
  const caption = `${total} ${total === 1 ? "completion" : "completions"} in the last ${HEATMAP_WEEKS} weeks`;

  return (
    <section
      aria-labelledby="consistency-heading"
      className="mt-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
    >
      <h2 id="consistency-heading" className="text-sm font-medium text-foreground/75">
        Consistency
      </h2>

      {/* One column per week, Monday at the top; the dots are for the eye, the caption says it in words */}
      <div
        role="img"
        aria-label={caption}
        className="mt-3 grid grid-flow-col grid-rows-7 gap-1"
        style={{ gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))` }}
      >
        {weeks.flatMap((week, w) =>
          week.map((day, d) =>
            day ? (
              <span
                key={day.date}
                title={describeDay(day.date, day.count)}
                className={cn("aspect-square rounded-full", LEVEL_CLASSES[day.level])}
              />
            ) : (
              // A day that has not happened yet keeps its place in the grid
              <span key={`empty-${w}-${d}`} aria-hidden className="aspect-square" />
            ),
          ),
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>{caption}</p>
        <div aria-hidden className="flex shrink-0 items-center gap-1">
          Less
          {LEVELS.map((level) => (
            <span key={level} className={cn("size-3 rounded-full", LEVEL_CLASSES[level])} />
          ))}
          More
        </div>
      </div>
    </section>
  );
}
