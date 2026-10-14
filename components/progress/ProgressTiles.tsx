import { CircleCheck, Flame, Star, Trophy } from "lucide-react";
import { HabitChip, Tile } from "@/components/today/StatTiles";
import type { TodayStats } from "@/lib/stats";
import { formatStreak } from "@/lib/streaks";
import type { GridRow } from "@/lib/week-grid";

interface ProgressTilesProps {
  // Today's counts, as on the Today page's ring
  today: { done: number; total: number };
  averageStreakDays: number;
  bestStreak: TodayStats["bestStreak"];
  // The habit with the most completed days in the shown week
  topHabit: GridRow | null;
}

export function ProgressTiles({ today, averageStreakDays, bestStreak, topHabit }: ProgressTilesProps) {
  return (
    <dl aria-label="Your progress" className="grid grid-cols-2 gap-3">
      <Tile
        label="Today"
        tint="bg-tint-green"
        badge={<CircleCheck className="size-5 text-complete" />}
        value={`${today.done}/${today.total}`}
        caption={today.total === 1 ? "habit done" : "habits done"}
      />
      <Tile
        label="Average streak"
        tint="bg-tint-orange"
        badge={<Flame className="size-5 text-cat-fitness" />}
        value={formatStreak({ unit: "day", current: averageStreakDays })}
        caption="across your habits"
      />
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
