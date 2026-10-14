import Link from "next/link";
import { cn } from "@/lib/utils";

export type HabitsTab = "browse" | "archived";

const TAB_CLASS =
  "rounded-sm px-4 py-2 text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HabitsTabs({
  active,
  archivedCount,
}: {
  active: HabitsTab;
  archivedCount: number;
}) {
  const tabs = [
    { id: "browse", label: "Browse", href: "/habits" },
    { id: "archived", label: `Archived (${archivedCount})`, href: "/habits?tab=archived" },
  ] as const;

  return (
    // A segmented control: a shared track with the active tab raised on it
    <nav
      aria-label="Habits views"
      className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted p-1 ring-1 ring-border sm:max-w-xs"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? "page" : undefined}
          className={cn(
            TAB_CLASS,
            active === tab.id
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
