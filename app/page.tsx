import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { TryDemoButton } from "@/components/demo/TryDemoButton";
import { Button } from "@/components/ui/button";

// Creating a demo (Try demo, a Server Action on this page) takes a few seconds, so allow more than a host's default
export const maxDuration = 60;

export default async function Home() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect("/today");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Build habits that stick.</h1>
        <p className="text-muted-foreground">
          A simple habit tracker with streaks and gentle nudges.
        </p>
      </div>
      <div className="flex flex-wrap items-start justify-center gap-3">
        <TryDemoButton
          variant="outline"
          className="bg-white text-neutral-900 hover:bg-white/90 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
        />
        <Button nativeButton={false} render={<Link href="/register" />}>
          Get started
        </Button>
        <Button
          variant="secondary"
          className="border-primary"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          Sign in
        </Button>
      </div>
    </main>
  );
}
