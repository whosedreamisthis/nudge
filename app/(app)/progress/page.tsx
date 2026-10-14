import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AiWeeklyReport } from "@/components/progress/AiWeeklyReport";
import { InsightsView } from "@/components/progress/InsightsView";
import { ProgressTiles } from "@/components/progress/ProgressTiles";
import { WeekNav } from "@/components/progress/WeekNav";
import { WeeklyGrid } from "@/components/progress/WeeklyGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { todayKey, weekStart } from "@/lib/dates";
import { getWeeklyReport } from "@/lib/db/ai-report";
import { getHeatmap } from "@/lib/db/consistency";
import { getInsights } from "@/lib/db/insights";
import { getProgressStats, getWeekGrid } from "@/lib/db/progress";
import { habitPerformance, weeklyAverage } from "@/lib/insights";
import { getAiSettings } from "@/lib/ai-settings";
import { getSessionUser } from "@/lib/session";
import { resolveWeek, topHabit } from "@/lib/week-grid";

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

  const ai = await getAiSettings(user);
  const today = todayKey(user.timezone);
  const thisWeek = weekStart(today);
  const rawWeek = Array.isArray(params.week) ? params.week[0] : params.week;
  const week = resolveWeek(rawWeek, today);

  // The grid can show an earlier week; the charts below it are always about the current one
  const [stats, rows, heatmap, insights, currentRows, report] = await Promise.all([
    getProgressStats(user.id, today),
    getWeekGrid(user.id, user.timezone, week, today),
    getHeatmap(user.id, today),
    getInsights(user.id, today),
    week === thisWeek
      ? null
      : getWeekGrid(user.id, user.timezone, thisWeek, today),
    // Fetched even while the report is switched off, so it is still there when it is switched back on
    getWeeklyReport(user.id, thisWeek),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progress" subtitle="How your week is going." />

      <ProgressTiles
        activeStreaks={stats.activeStreaks}
        bestStreak={stats.bestStreak}
        weeklyAverage={weeklyAverage(heatmap, today)}
        topHabit={topHabit(rows)}
      />

      <AiWeeklyReport
        initial={report}
        timezone={user.timezone}
        aiEnabled={ai.weeklyReport}
        hasHabits={(currentRows ?? rows).length > 0}
      />

      {/* One column on phones and tablets; from xl the grid sits left and the charts right */}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-start xl:gap-8">
        <section
          aria-labelledby="grid-heading"
          className="flex w-full flex-col gap-3"
        >
          <h2 id="grid-heading" className="text-lg font-semibold">
            Habits by day
          </h2>
          <WeekNav week={week} thisWeek={thisWeek} />
          <WeeklyGrid
            rows={rows}
            today={today}
            isCurrentWeek={week === thisWeek}
          />
        </section>

        <InsightsView
          insights={insights}
          performance={habitPerformance(currentRows ?? rows)}
        />
      </div>
    </div>
  );
}
