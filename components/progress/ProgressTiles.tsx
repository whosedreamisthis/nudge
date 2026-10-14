import { Activity, Flame, Star, Trophy } from "lucide-react";
import { HabitChip, Tile } from "@/components/shared/StatTile";
import type { TodayStats } from "@/lib/stats";
import { formatStreak } from "@/lib/streaks";
import type { GridRow } from "@/lib/week-grid";

interface ProgressTilesProps {
  activeStreaks: TodayStats["activeStreaks"];
  bestStreak: TodayStats["bestStreak"];
  // Completions per day over the last 7 days
  weeklyAverage: number;
  // The habit with the most completed days in the shown week
  topHabit: GridRow | null;
}

export function ProgressTiles({ activeStreaks, bestStreak, weeklyAverage, topHabit }: ProgressTilesProps) {
  return (
    <dl aria-label="Your progress" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Tile
        label="Best streak"
        tint="bg-tint-amber"
        badge={<Trophy className="size-5 text-habit-amber" />}
        value={bestStreak ? formatStreak({ unit: bestStreak.unit, current: bestStreak.best }) : "0"}
        caption={
          bestStreak ? (
            <HabitChip icon={bestStreak.icon} name={bestStreak.name} />
          ) : (
            "Complete a habit to start one"
          )
        }
      />
      <Tile
        label="Active streaks"
        tint="bg-tint-orange"
        badge={<Flame className="size-5 text-cat-fitness" />}
        value={activeStreaks}
        caption={activeStreaks === 1 ? "habit on a roll" : "habits on a roll"}
      />
      <Tile
        label="Weekly average"
        tint="bg-tint-amber"
        badge={<Activity className="size-5 text-habit-amber" />}
        value={weeklyAverage}
        caption="completions a day, last 7 days"
      />
      <Tile
        label="Top habit"
        tint="bg-tint-purple"
        badge={<Star className="size-5 text-habit-violet" />}
        // Days completed in the shown week; the grid below has each habit's done/target
        value={topHabit ? `${topHabit.done} ${topHabit.done === 1 ? "day" : "days"}` : "–"}
        caption={
          topHabit ? (
            <HabitChip icon={topHabit.icon} name={topHabit.name} />
          ) : (
            "Nothing completed this week"
          )
        }
      />
    </dl>
  );
}
