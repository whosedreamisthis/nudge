"use server";

import { revalidatePath } from "next/cache";
import { expireJournal } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { todayKey, toDbDate } from "@/lib/dates";
import { deleteEntrySchema, saveEntrySchema, type SaveEntryInput } from "@/lib/journal";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

// Autosave target. Without an id it creates an entry for the user's local today (and returns the
// id and creation time); with one it updates that entry. An empty new entry is not created, so
// nothing is returned for it. No revalidation, the editor already holds the text and a refresh
// mid-typing would be disruptive.
export async function saveJournalEntry(
  input: SaveEntryInput,
): Promise<ActionResult<{ id: string; createdAt: string } | null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const parsed = saveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  const { id, content, mood } = parsed.data;

  try {
    if (id) {
      const { count } = await prisma.journalEntry.updateMany({
        where: { id, userId: user.id },
        data: { content, mood },
      });
      if (count === 0) return { success: false, error: "Entry not found" };
      expireJournal(user.id);
      return { success: true, data: null };
    }

    if (content.trim() === "" && mood === null) return { success: true, data: null };

    const entry = await prisma.journalEntry.create({
      data: { userId: user.id, date: toDbDate(todayKey(user.timezone)), content, mood },
      select: { id: true, createdAt: true },
    });
    expireJournal(user.id);
    return { success: true, data: { id: entry.id, createdAt: entry.createdAt.toISOString() } };
  } catch {
    return { success: false, error: "Could not save, try again" };
  }
}

// Removes one entry for good
export async function deleteJournalEntry(input: { id: string }): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const parsed = deleteEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid entry" };

  try {
    await prisma.journalEntry.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
  } catch {
    return { success: false, error: "Could not delete the entry, try again" };
  }

  expireJournal(user.id);
  revalidatePath("/journal");
  return { success: true, data: null };
}
