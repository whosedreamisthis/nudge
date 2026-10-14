import { connection } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NewHabitModal } from "@/components/habits/NewHabitModal";
import { ConsistencyCard } from "@/components/today/ConsistencyCard";
import { DayRollover } from "@/components/today/DayRollover";
import { MorningMotivation } from "@/components/today/MorningMotivation";
import { EmptyHabits } from "@/components/today/EmptyHabits";
import { TodayHabits } from "@/components/today/TodayHabits";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimezoneSync } from "@/components/shared/TimezoneSync";
import { formatLongDate, todayKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getHeatmap } from "@/lib/db/consistency";
import { getMotivation } from "@/lib/db/motivation";
import { getToday } from "@/lib/db/today";
import { getSampleToday } from "@/lib/sample-habits";
import { getSessionUser } from "@/lib/session";

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  // Everything here is per user and per request (database, clock), so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, clerkUser, params] = await Promise.all([
    getSessionUser(),
    currentUser(),
    searchParams,
  ]);
  if (!user) return null;

  const today = todayKey(user.timezone);
  // /today?sample=1 fills the page with made-up habits, in development only
  const useSample = process.env.NODE_ENV !== "production" && params.sample === "1";
  const [{ habits }, categories, heatmap, motivation] = await Promise.all([
    useSample ? getSampleToday(today) : getToday(user.id, today),
    // For the edit form, which reuses the New Habit modal
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    // The made-up habits have no completions to chart
    useSample ? null : getHeatmap(user.id, today),
    // Generated in the browser on the first visit of the day, so the page doesn't wait for Gemini
    useSample || !user.aiEnabled ? null : getMotivation(user.id, today),
  ]);

  const header = {
    title: `Hey ${clerkUser?.firstName ?? "Friend"}`,
    subtitle: formatLongDate(today),
  };

  return (
    <>
      <TimezoneSync />
      <DayRollover today={today} timezone={user.timezone} />
      <NewHabitModal categories={categories} />
      {habits.length === 0 ? (
        <>
          <PageHeader {...header} />
          <EmptyHabits />
        </>
      ) : (
        <TodayHabits
          key={today}
          habits={habits}
          header={<PageHeader {...header} />}
          banner={
            !useSample && user.aiEnabled && (
              <MorningMotivation initial={motivation} canGenerate />
            )
          }
          aside={heatmap && <ConsistencyCard heatmap={heatmap} />}
          sample={useSample}
        />
      )}
    </>
  );
}
