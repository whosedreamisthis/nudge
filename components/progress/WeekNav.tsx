import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, type DateKey } from "@/lib/dates";
import { weekRangeLabel } from "@/lib/week-grid";
import { cn } from "@/lib/utils";

const ARROW_CLASS =
  "flex size-8 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Previous and next week arrows around the date range; the current week has no param,
// and next is switched off there since the future has nothing to show
export function WeekNav({ week, thisWeek }: { week: DateKey; thisWeek: DateKey }) {
  const href = (target: DateKey) => (target === thisWeek ? "/progress" : `/progress?week=${target}`);
  const isCurrent = week === thisWeek;

  return (
    <nav aria-label="Week" className="flex items-center justify-between gap-2">
      <Link
        href={href(addDays(week, -7))}
        scroll={false}
        aria-label="Previous week"
        className={cn(ARROW_CLASS, "hover:bg-muted")}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
      <p className="text-sm font-medium" aria-live="polite">
        {weekRangeLabel(week)}
        {isCurrent && <span className="ml-2 text-muted-foreground">This week</span>}
      </p>
      {isCurrent ? (
        <span
          aria-disabled="true"
          aria-label="Next week (not available)"
          className={cn(ARROW_CLASS, "text-muted-foreground opacity-40")}
        >
          <ChevronRight aria-hidden className="size-5" />
        </span>
      ) : (
        <Link
          href={href(addDays(week, 7))}
          scroll={false}
          aria-label="Next week"
          className={cn(ARROW_CLASS, "hover:bg-muted")}
        >
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      )}
    </nav>
  );
}
