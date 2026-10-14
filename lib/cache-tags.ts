import { updateTag } from "next/cache";

// Cache tags, one per kind of data so a write only expires what it changes
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

export function expireJournal(userId: string) {
  updateTag(journalTag(userId));
}
