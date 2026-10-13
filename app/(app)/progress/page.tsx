import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function ProgressPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return <PageHeader title="Progress" subtitle="Your weekly progress and insights will show up here." />;
}
