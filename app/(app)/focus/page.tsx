import { auth } from "@clerk/nextjs/server";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function FocusPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return (
    <>
      <PageHeader title="Focus" subtitle="A quiet timer for meditation and deep work." />
      {/* TEMP_TIMER (seconds) adds a short test timer; leave it unset in production */}
      <FocusTimer testSeconds={Number(process.env.TEMP_TIMER) || null} />
    </>
  );
}
