import { revalidateTag, updateTag } from "next/cache";

// Cache tags, one per kind of data so a write only expires what it changes
// The catalog only changes with the seed; a new deploy gets a fresh cache, so nothing expires it
export const CATALOG_TAG = "catalog";
export const habitsTag = (userId: string) => `user:${userId}:habits`;
export const completionsTag = (userId: string) => `user:${userId}:completions`;
export const journalTag = (userId: string) => `user:${userId}:journal`;

// For Server Actions only: expire the habit list and everything computed from completions
export function expireHabitData(userId: string) {
  updateTag(habitsTag(userId));
  updateTag(completionsTag(userId));
}

export function expireCompletions(userId: string) {
  updateTag(completionsTag(userId));
}

// Deleting re-renders the page with fresh data straight away
export function expireJournal(userId: string) {
  updateTag(journalTag(userId));
}

// For autosave: stale-while-revalidate, so saving does not re-render the page mid-typing. The
// editors read their text from uncached queries, so a stale History list is the only effect.
export function refreshJournal(userId: string) {
  revalidateTag(journalTag(userId), "max");
}
