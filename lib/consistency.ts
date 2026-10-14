import { addDays, weekStart, type DateKey } from "@/lib/dates";

// Pure functions over plain data: the caller loads the per-day counts and passes them in.

export const HEATMAP_WEEKS = 14;

// 0 means nothing was completed; 1 to 4 run from a little to a lot
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export type HeatDay = { date: DateKey; count: number; level: HeatLevel };

// Seven days per column, Monday first; a day after today is null (the current week is not over)
export type HeatWeek = (HeatDay | null)[];

export type Heatmap = { weeks: HeatWeek[]; total: number };

// The first day of the grid: the Monday of the week that starts 13 weeks before this one
export function heatmapStart(today: DateKey): DateKey {
  return addDays(weekStart(today), -7 * (HEATMAP_WEEKS - 1));
}

// Steps are relative to the busiest day in the period, so a user with 2 habits and one with 20
// both see the full scale. Any completion shows at least step 1.
export function heatLevel(count: number, max: number): HeatLevel {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as HeatLevel;
}

// `counts` maps a day to how many habits were completed that day
export function buildHeatmap(counts: ReadonlyMap<DateKey, number>, today: DateKey): Heatmap {
  const start = heatmapStart(today);
  const days: (DateKey | null)[] = Array.from({ length: HEATMAP_WEEKS * 7 }, (_, i) => {
    const date = addDays(start, i);
    return date <= today ? date : null;
  });

  const max = Math.max(0, ...days.map((date) => (date ? (counts.get(date) ?? 0) : 0)));
  let total = 0;

  const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, w) =>
    days.slice(w * 7, w * 7 + 7).map((date) => {
      if (!date) return null;
      const count = counts.get(date) ?? 0;
      total += count;
      return { date, count, level: heatLevel(count, max) };
    }),
  );

  return { weeks, total };
}
