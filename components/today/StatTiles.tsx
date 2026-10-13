import { Flame, Trophy } from "lucide-react";
import type { TodayStats } from "@/lib/stats";
import { formatStreak } from "@/lib/streaks";

export function StatTiles({ stats }: { stats: TodayStats }) {
  const { activeStreaks, bestStreak } = stats;

  return (
    <dl aria-label="Your stats" className="mb-6 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-card p-4 text-card-foreground shadow-sm ring-1 ring-border">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Flame aria-hidden className="size-4" />
          Active streaks
        </dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums">{activeStreaks}</dd>
      </div>

      <div className="rounded-xl bg-card p-4 text-card-foreground shadow-sm ring-1 ring-border">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Trophy aria-hidden className="size-4" />
          Best streak
        </dt>
        <dd className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums">
          {bestStreak ? (
            <>
              {formatStreak({
                unit: bestStreak.unit,
                current: bestStreak.best,
              })}
              <span
                role="img"
                aria-label={bestStreak.name}
                title={bestStreak.name}
                className="text-xl"
              >
                {bestStreak.icon}
              </span>
            </>
          ) : (
            "0"
          )}
        </dd>
      </div>
    </dl>
  );
}
