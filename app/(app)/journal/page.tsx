import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { courier } from "@/components/journal/courier";
import { HistoryFilters } from "@/components/journal/HistoryFilters";
import { HistoryList } from "@/components/journal/HistoryList";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalTabs } from "@/components/journal/JournalTabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatLongDate, todayKey } from "@/lib/dates";
import { getEntry, getEntryMonths, getHistory } from "@/lib/db/journal";
import { HISTORY_PAGE_SIZE, parseHistoryParams } from "@/lib/journal";
import { getSessionUser } from "@/lib/session";

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  // Per user and per request (database, clock), so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  if (!user) return null;

  const today = todayKey(user.timezone);
  const historyTab = params.tab === "history";

  if (!historyTab) {
    const entry = await getEntry(user.id, today);
    return (
      <>
        <PageHeader title="Journal" subtitle={formatLongDate(today)} />
        <JournalTabs active="write" />
        {/* Keyed by day so a new day starts with a fresh editor */}
        <JournalEditor
          key={today}
          initialContent={entry?.content ?? ""}
          initialMood={entry?.mood ?? null}
          fontClassName={courier.className}
        />
      </>
    );
  }

  const filters = parseHistoryParams(params);
  const [history, months] = await Promise.all([
    getHistory(user.id, filters),
    getEntryMonths(user.id),
  ]);

  // "Show more" keeps the filters and raises the limit by one page
  const next = new URLSearchParams({ tab: "history" });
  if (filters.q) next.set("q", filters.q);
  if (filters.month) next.set("month", filters.month);
  if (filters.mood) next.set("mood", String(filters.mood));
  next.set("limit", String(filters.limit + HISTORY_PAGE_SIZE));

  return (
    <>
      <PageHeader title="Journal" subtitle="Your past entries." />
      <JournalTabs active="history" />
      <HistoryFilters months={months} q={filters.q} month={filters.month} mood={filters.mood} />
      <HistoryList
        {...history}
        filtered={Boolean(filters.q || filters.month || filters.mood)}
        nextHref={`/journal?${next.toString()}`}
      />
    </>
  );
}
