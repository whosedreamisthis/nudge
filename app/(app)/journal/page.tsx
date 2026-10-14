import { connection } from "next/server";
import { Courier_Prime } from "next/font/google";
import { auth } from "@clerk/nextjs/server";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatLongDate, todayKey } from "@/lib/dates";
import { getEntry } from "@/lib/db/journal";
import { getSessionUser } from "@/lib/session";

const courier = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });

export default async function JournalPage() {
  // Per user and per request (database, clock), so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const user = await getSessionUser();
  if (!user) return null;

  const today = todayKey(user.timezone);
  const entry = await getEntry(user.id, today);

  return (
    <>
      <PageHeader title="Journal" subtitle={formatLongDate(today)} />
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
