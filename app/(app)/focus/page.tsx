import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function FocusPage() {
  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  return <PageHeader title="Focus" subtitle="Your focus and meditation timer will show up here." />;
}
