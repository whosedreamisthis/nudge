import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function HabitsPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return <PageHeader title="Habits" subtitle="Browse and add habits here." />;
}
