import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/register" />}>
          Get started
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/sign-in" />}>
          Sign in
        </Button>
      </div>
    </main>
  );
}
