import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { PageHeader } from "@/components/shared/PageHeader";
import { getFocusHabit } from "@/lib/db/focus";
import { getSessionUser } from "@/lib/session";

export default async function FocusPage({ searchParams }: PageProps<"/focus">) {
  // The optional ?habit= link is checked against the user's habits, so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  const habitId = typeof params.habit === "string" ? params.habit : null;
  // An unknown, archived or someone else's habit just gives a free session
  const habit = user && habitId ? await getFocusHabit(user.id, habitId) : null;

  return (
    <>
      <PageHeader title="Focus" subtitle="A quiet timer for meditation and deep work." />
      {/* TEMP_TIMER (seconds) adds a short test timer; leave it unset in production */}
      <FocusTimer
        habit={habit ? { habitId: habit.id, habitName: habit.name } : null}
        testSeconds={Number(process.env.TEMP_TIMER) || null}
      />
    </>
  );
}
