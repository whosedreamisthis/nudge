import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ProgressTiles } from "@/components/progress/ProgressTiles";
import { WeekNav } from "@/components/progress/WeekNav";
import { WeeklyGrid } from "@/components/progress/WeeklyGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { todayKey, weekStart } from "@/lib/dates";
import { getWeekGrid } from "@/lib/db/progress";
import { getToday } from "@/lib/db/today";
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

  const [{ habits, stats }, rows] = await Promise.all([
    getToday(user.id, today),
    getWeekGrid(user.id, user.timezone, week, today),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progress" subtitle="How your week is going." />

      <ProgressTiles
        today={getRingCounts(habits)}
        averageStreakDays={averageStreakDays(habits.map((habit) => habit.streak))}
        bestStreak={stats.bestStreak}
        topHabit={topHabit(rows)}
      />

      <section aria-labelledby="weekly-heading" className="flex flex-col gap-3">
        <h2 id="weekly-heading" className="text-lg font-semibold">
          Weekly
        </h2>
        <WeekNav week={week} thisWeek={thisWeek} />
        <WeeklyGrid rows={rows} today={today} isCurrentWeek={week === thisWeek} />
      </section>
    </div>
  );
}
