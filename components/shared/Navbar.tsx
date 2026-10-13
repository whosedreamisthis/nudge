import { Suspense } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/shared/Logo";

async function UserMenu() {
  const { isAuthenticated } = await auth();
  return isAuthenticated ? <UserButton /> : null;
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
