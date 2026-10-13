"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CategoryOption } from "@/components/habits/NewHabitModal";

const FIELD_CLASS =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Search and category live in the URL, so the list itself stays a server component
export function CatalogFilters({
  categories,
  q,
  category,
}: {
  categories: CategoryOption[];
  q: string;
  category: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);
  // What the URL last got, so a category change keeps the search text and vice versa
  const latest = useRef({ q, category });

  function update(next: { q: string; category: string }) {
    latest.current = next;
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Wait for a pause in typing before navigating
  useEffect(() => {
    if (text.trim() === latest.current.q) return;
    const timer = setTimeout(() => update({ q: text.trim(), category: latest.current.category }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={60}
        aria-label="Search habits"
        placeholder="Search habits"
        className={`${FIELD_CLASS} flex-1`}
      />
      <select
        value={category}
        onChange={(e) => update({ q: latest.current.q, category: e.target.value })}
        aria-label="Filter by category"
        className={FIELD_CLASS}
      >
        <option value="">All categories</option>
        {categories.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
