import Link from "next/link";
import { cn } from "@/lib/utils";

export type HabitsTab = "browse" | "archived";

const TAB_CLASS =
  "rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
    <nav aria-label="Habits views" className="flex gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? "page" : undefined}
          className={cn(
            TAB_CLASS,
            active === tab.id
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
