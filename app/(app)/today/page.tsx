import { connection } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { EmptyHabits } from "@/components/today/EmptyHabits";
import { HabitRow } from "@/components/today/HabitRow";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimezoneSync } from "@/components/shared/TimezoneSync";
import { formatLongDate, todayKey } from "@/lib/dates";
import { getTodayHabits } from "@/lib/db/today";
import { getSampleTodayHabits } from "@/lib/sample-habits";
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
  const habits = useSample ? getSampleTodayHabits(today) : await getTodayHabits(user.id, today);

  return (
    <>
      <TimezoneSync />
      <PageHeader title={`Hey ${clerkUser?.firstName ?? "Friend"}`} subtitle={formatLongDate(today)} />

      {habits.length === 0 ? (
        <EmptyHabits />
      ) : (
        <ul aria-label="Today's habits" className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </ul>
      )}
    </>
  );
}
