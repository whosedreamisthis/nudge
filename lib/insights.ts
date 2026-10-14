import { addDays, weekDays, weekStart, type DateKey } from "@/lib/dates";
import type { Heatmap } from "@/lib/consistency";
import type { GridRow } from "@/lib/week-grid";

// Pure functions over plain data: the caller loads the per-day counts and passes them in.

export const MONTH_DAYS = 30;

export type ChartDay = { date: DateKey; count: number };

export type Insights = {
  // Completions in the last 30 days (today and the 29 before)
  last30: number;
  // The 30 days before those
  previous30: number;
  thisWeek: ChartDay[];
  lastWeek: ChartDay[];
};

// The first day the insights need: the start of the previous 30-day period. It also covers
// last week's Monday, which is at most 13 days back.
export function insightsStart(today: DateKey): DateKey {
  return addDays(today, -(MONTH_DAYS * 2 - 1));
}

function sumDays(counts: ReadonlyMap<DateKey, number>, from: DateKey, days: number): number {
  let sum = 0;
  for (let i = 0; i < days; i++) sum += counts.get(addDays(from, i)) ?? 0;
  return sum;
}

// A day after today is counted as 0 (it has not happened), so the chart stays seven days wide
export function buildInsights(counts: ReadonlyMap<DateKey, number>, today: DateKey): Insights {
  const week = weekStart(today);
  const series = (monday: DateKey): ChartDay[] =>
    weekDays(monday).map((date) => ({ date, count: date <= today ? (counts.get(date) ?? 0) : 0 }));

  const last30Start = addDays(today, -(MONTH_DAYS - 1));

  return {
    last30: sumDays(counts, last30Start, MONTH_DAYS),
    previous30: sumDays(counts, addDays(last30Start, -MONTH_DAYS), MONTH_DAYS),
    thisWeek: series(week),
    lastWeek: series(addDays(week, -7)),
  };
}

// Completions per day over the last 7 days (today and the 6 before), one decimal.
// Read from the heatmap's days, which already hold the per-day counts.
export function weeklyAverage(heatmap: Heatmap, today: DateKey): number {
  const from = addDays(today, -6);
  let sum = 0;
  for (const week of heatmap.weeks) {
    for (const day of week) {
      if (day && day.date >= from && day.date <= today) sum += day.count;
    }
  }
  return Math.round((sum / 7) * 10) / 10;
}

export type HabitPerformance = {
  id: string;
  name: string;
  icon: string;
  color: string;
  done: number;
  target: number;
  // 0 to 100, capped: doing more days than the target is still 100%
  percent: number;
};

export function habitPerformance(rows: GridRow[]): HabitPerformance[] {
  return rows.map(({ id, name, icon, color, done, target }) => ({
    id,
    name,
    icon,
    color,
    done,
    target,
    percent: target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0,
  }));
}
