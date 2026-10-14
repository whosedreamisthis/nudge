import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { courier } from "@/components/journal/courier";
import { DeleteEntryButton } from "@/components/journal/DeleteEntryButton";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatLongDate, todayKey } from "@/lib/dates";
import { getEntry } from "@/lib/db/journal";
import { isDateKey } from "@/lib/journal";
import { getSessionUser } from "@/lib/session";

// One past entry, to read or edit
export default async function JournalEntryPage({ params }: PageProps<"/journal/[date]">) {
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, { date }] = await Promise.all([getSessionUser(), params]);
  if (!user || !isDateKey(date)) notFound();

  const today = todayKey(user.timezone);
  // Today is written on the Today tab; the future has nothing to show
  if (date === today) redirect("/journal");
  if (date > today) notFound();

  const entry = await getEntry(user.id, date);
  if (!entry) notFound();

  const label = formatLongDate(date);

  return (
    <>
      <Link
        href="/journal?tab=history"
        className="inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        History
      </Link>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={label} />
        <DeleteEntryButton date={date} label={label} />
      </div>
      <JournalEditor
        key={date}
        date={date}
        initialContent={entry.content}
        initialMood={entry.mood}
        fontClassName={courier.className}
      />
    </>
  );
}
