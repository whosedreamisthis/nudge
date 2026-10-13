import { getStreak, type Streak, type StreakInput } from "@/lib/streaks";

export type StatsEntry = { name: string; icon: string; history: StreakInput };

export type TodayStats = {
  // Habits whose streak is running right now
  activeStreaks: number;
  // The longest streak ever and the habit that holds it, null when none has started
  bestStreak: (Pick<Streak, "unit" | "best"> & { name: string; icon: string }) | null;
};

// Streaks count days for daily habits and weeks for weekly ones, so compare them in days
const lengthInDays = ({ unit, best }: Pick<Streak, "unit" | "best">) =>
  unit === "week" ? best * 7 : best;

// Pure summary over the same per-habit histories the streak helpers take
export function getTodayStats(entries: StatsEntry[]): TodayStats {
  let activeStreaks = 0;
  let bestStreak: TodayStats["bestStreak"] = null;

  for (const { name, icon, history } of entries) {
    const streak = getStreak(history);
    if (streak.current > 0) activeStreaks++;
    if (streak.best > 0 && (!bestStreak || lengthInDays(streak) > lengthInDays(bestStreak))) {
      bestStreak = { unit: streak.unit, best: streak.best, name, icon };
    }
  }

  return { activeStreaks, bestStreak };
}
