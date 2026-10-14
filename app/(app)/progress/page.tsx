import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { InsightsView } from "@/components/progress/InsightsView";
import { ProgressTiles } from "@/components/progress/ProgressTiles";
import { WeekNav } from "@/components/progress/WeekNav";
import { WeeklyGrid } from "@/components/progress/WeeklyGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { todayKey, weekStart } from "@/lib/dates";
import { getHeatmap } from "@/lib/db/consistency";
import { getInsights } from "@/lib/db/insights";
import { getWeekGrid } from "@/lib/db/progress";
import { getToday } from "@/lib/db/today";
import { habitPerformance, weeklyAverage } from "@/lib/insights";
import { getSessionUser } from "@/lib/session";
import { getRingCounts } from "@/lib/week-goal";
import { averageStreakDays, resolveWeek, topHabit } from "@/lib/week-grid";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Everything here is per user and per request (database, clock), so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  if (!user) return null;

  const today = todayKey(user.timezone);
  const thisWeek = weekStart(today);
  const rawWeek = Array.isArray(params.week) ? params.week[0] : params.week;
  const week = resolveWeek(rawWeek, today);

  // The grid can show an earlier week; the charts below it are always about the current one
  const [{ habits }, rows, heatmap, insights, currentRows] = await Promise.all([
    getToday(user.id, today),
    getWeekGrid(user.id, user.timezone, week, today),
    getHeatmap(user.id, today),
    getInsights(user.id, today),
    week === thisWeek ? null : getWeekGrid(user.id, user.timezone, thisWeek, today),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progress" subtitle="How your week is going." />

      <ProgressTiles
        today={getRingCounts(habits)}
        averageStreakDays={averageStreakDays(habits.map((habit) => habit.streak))}
        weeklyAverage={weeklyAverage(heatmap, today)}
        topHabit={topHabit(rows)}
      />

      <section aria-labelledby="grid-heading" className="mx-auto flex w-full flex-col gap-3 xl:max-w-4xl">
        <h2 id="grid-heading" className="text-lg font-semibold">
          Habits by day
        </h2>
        <WeekNav week={week} thisWeek={thisWeek} />
        <WeeklyGrid rows={rows} today={today} isCurrentWeek={week === thisWeek} />
      </section>

      <InsightsView insights={insights} performance={habitPerformance(currentRows ?? rows)} />
    </div>
  );
}
