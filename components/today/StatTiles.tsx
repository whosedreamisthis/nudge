import { Flame, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { TodayStats } from "@/lib/stats";
import { formatStreak } from "@/lib/streaks";

interface TileProps {
  label: string;
  badge: ReactNode;
  tint: string;
  value: ReactNode;
  caption: ReactNode;
}

function Tile({ label, badge, tint, value, caption }: TileProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl p-4 text-foreground shadow-sm ${tint}`}>
      <dt className="flex items-center gap-2 text-sm font-medium text-foreground/75">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card/70 text-lg"
        >
          {badge}
        </span>
        {label}
      </dt>
      <dd className="flex flex-col">
        <span className="text-4xl leading-none font-bold tabular-nums">{value}</span>
        <span className="mt-1.5 truncate text-sm text-foreground/75">{caption}</span>
      </dd>
    </div>
  );
}

export function StatTiles({ stats }: { stats: TodayStats }) {
  const { activeStreaks, bestStreak } = stats;

  return (
    <dl aria-label="Your stats" className="mb-6 grid grid-cols-2 gap-3">
      <Tile
        label="Active streaks"
        tint="bg-tint-orange"
        badge={<Flame className="size-5 text-cat-fitness" />}
        value={activeStreaks}
        caption={activeStreaks === 1 ? "habit on a roll" : "habits on a roll"}
      />
      <Tile
        label="Best streak"
        tint="bg-tint-amber"
        badge={bestStreak ? bestStreak.icon : <Trophy className="size-5 text-habit-amber" />}
        value={bestStreak ? formatStreak({ unit: bestStreak.unit, current: bestStreak.best }) : "0"}
        caption={bestStreak ? bestStreak.name : "Complete a habit to start one"}
      />
    </dl>
  );
}
