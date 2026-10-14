"use server";

import { prisma } from "@/lib/db";
import { todayKey, toDbDate } from "@/lib/dates";
import { saveEntrySchema, type SaveEntryInput } from "@/lib/journal";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

// Autosave target: creates or updates the entry for the user's local today. No revalidation, the
// editor already holds the text and a refresh mid-typing would be disruptive.
export async function saveJournalEntry(input: SaveEntryInput): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const parsed = saveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { content, mood } = parsed.data;
  const date = toDbDate(todayKey(user.timezone));

  try {
    await prisma.journalEntry.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: { content, mood },
      create: { userId: user.id, date, content, mood },
    });
  } catch {
    return { success: false, error: "Could not save, try again" };
  }

  return { success: true, data: null };
}
