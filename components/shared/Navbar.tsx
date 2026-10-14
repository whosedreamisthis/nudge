import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { SettingsButton } from "@/components/shared/SettingsButton";
import { getAiSettings } from "@/lib/ai-settings";
import { getSessionUser } from "@/lib/session";

// Per user and per request (session, database), so stop prerendering before reading them
async function UserMenu() {
  await connection();
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const user = await getSessionUser();

  return (
    <div className="flex items-center gap-2">
      {user && (
        <SettingsButton
          timezone={user.timezone}
          ai={await getAiSettings(user)}
          isDemo={user.isDemo}
        />
      )}
      {/* UserButton's menu opens the profile and email editor, which a demo user can't use */}
      {user?.isDemo ? (
        <SignOutButton redirectUrl="/">
          <Button variant="outline" size="sm">
            Sign out
          </Button>
        </SignOutButton>
      ) : (
        <UserButton />
      )}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur">
      <nav className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="text-xl font-bold tracking-tight">Nudge</span>
        </Link>
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </nav>
    </header>
  );
}
