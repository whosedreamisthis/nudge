import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimezoneSync } from "@/components/shared/TimezoneSync";

export default async function TodayPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return (
    <>
      <TimezoneSync />
      <PageHeader title="Today" subtitle="Your habits will show up here." />
    </>
  );
}
