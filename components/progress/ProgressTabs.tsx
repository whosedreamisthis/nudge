import Link from "next/link";
import { cn } from "@/lib/utils";

export type ProgressTab = "overview" | "insights";

const TAB_CLASS =
  "rounded-lg px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProgressTabs({ active }: { active: ProgressTab }) {
  const tabs = [
    { id: "overview", label: "Overview", href: "/progress" },
    { id: "insights", label: "Insights", href: "/progress?tab=insights" },
  ] as const;

  return (
    // A segmented control: a shared track with the active tab raised on it
    <nav
      aria-label="Progress views"
      className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1 ring-1 ring-border sm:max-w-xs"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          scroll={false}
          aria-current={active === tab.id ? "page" : undefined}
          className={cn(
            TAB_CLASS,
            "text-center",
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
