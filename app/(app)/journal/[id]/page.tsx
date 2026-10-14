import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { courier } from "@/components/journal/courier";
import { DeleteEntryButton } from "@/components/journal/DeleteEntryButton";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatLongDate } from "@/lib/dates";
import { getEntryById } from "@/lib/db/journal";
import { getSessionUser } from "@/lib/session";

// One entry, to read or edit
export default async function JournalEntryPage({ params }: PageProps<"/journal/[id]">) {
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const [user, { id }] = await Promise.all([getSessionUser(), params]);
  if (!user) notFound();

  // Scoped to the signed-in user, so someone else's entry looks like it doesn't exist
  const entry = await getEntryById(user.id, id);
  if (!entry) notFound();

  const label = formatLongDate(entry.date);

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
        <DeleteEntryButton id={entry.id} label={label} />
      </div>
      <JournalEditor
        key={entry.id}
        entryId={entry.id}
        initialContent={entry.content}
        initialMood={entry.mood}
        createdAt={entry.createdAt.toISOString()}
        timezone={user.timezone}
        fontClassName={courier.className}
      />
    </>
  );
}
