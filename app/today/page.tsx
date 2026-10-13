import { auth } from "@clerk/nextjs/server";
import { TimezoneSync } from "@/components/shared/TimezoneSync";

export default async function TodayPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-2 px-4 py-8">
      <TimezoneSync />
      <h1 className="text-3xl font-bold">Today</h1>
      <p className="text-muted-foreground">Your habits will show up here.</p>
    </main>
  );
}
