import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function JournalPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return <PageHeader title="Journal" subtitle="Your daily entries will show up here." />;
}
