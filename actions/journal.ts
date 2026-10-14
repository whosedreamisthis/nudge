"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { todayKey, toDbDate } from "@/lib/dates";
import {
  deleteEntrySchema,
  saveEntrySchema,
  type SaveEntryInput,
} from "@/lib/journal";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

// Autosave target: creates or updates the entry for a day (the user's local today unless a date
// is given). No revalidation, the editor already holds the text and a refresh mid-typing would
// be disruptive.
export async function saveJournalEntry(input: SaveEntryInput): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const parsed = saveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const { content, mood } = parsed.data;
  const today = todayKey(user.timezone);
  const day = parsed.data.date ?? today;
  // YYYY-MM-DD strings compare in date order
  if (day > today) return { success: false, error: "You can't write an entry for a future day" };
  const date = toDbDate(day);

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

// Removes one day's entry for good
export async function deleteJournalEntry(input: { date: string }): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const parsed = deleteEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid date" };

  try {
    await prisma.journalEntry.deleteMany({
      where: { userId: user.id, date: toDbDate(parsed.data.date) },
    });
  } catch {
    return { success: false, error: "Could not delete the entry, try again" };
  }

  revalidatePath("/journal");
  return { success: true, data: null };
}
