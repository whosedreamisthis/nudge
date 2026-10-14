"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MOODS, monthLabel } from "@/lib/journal";

const FIELD_CLASS =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface HistoryFiltersProps {
  months: string[];
  q: string;
  month: string;
  mood: number | null;
}

// Search, month and mood live in the URL, so the list itself stays a server component
export function HistoryFilters({ months, q, month, mood }: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);

  function go(next: { q: string; month: string; mood: number | null }) {
    const params = new URLSearchParams({ tab: "history" });
    if (next.q) params.set("q", next.q);
    if (next.month) params.set("month", next.month);
    if (next.mood) params.set("mood", String(next.mood));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Wait for a pause in typing before navigating
  useEffect(() => {
    if (text.trim() === q) return;
    const timer = setTimeout(() => go({ q: text.trim(), month, mood }), 300);
    return () => clearTimeout(timer);
  });

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={60}
        aria-label="Search entries"
        placeholder="Search entries"
        className={`${FIELD_CLASS} min-w-0 flex-1`}
      />
      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => go({ q: text.trim(), month: e.target.value, mood })}
          aria-label="Filter by month"
          className={`${FIELD_CLASS} min-w-0 flex-1 sm:flex-none`}
        >
          <option value="">All months</option>
          {months.map((value) => (
            <option key={value} value={value}>
              {monthLabel(value)}
            </option>
          ))}
        </select>
        <select
          value={mood ?? ""}
          onChange={(e) =>
            go({ q: text.trim(), month, mood: e.target.value ? Number(e.target.value) : null })
          }
          aria-label="Filter by mood"
          className={`${FIELD_CLASS} min-w-0 flex-1 sm:flex-none`}
        >
          <option value="">Any mood</option>
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.emoji} {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
