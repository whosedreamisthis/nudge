import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/60 backdrop-blur">
      <nav className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="text-xl font-bold tracking-tight">Nudge</span>
        </Link>
      </nav>
    </header>
  );
}
