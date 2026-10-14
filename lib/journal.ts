import { z } from "zod";
import { toDbDate, type DateKey } from "@/lib/dates";

export const MAX_ENTRY_LENGTH = 20000;
export const HISTORY_PAGE_SIZE = 30;
const PREVIEW_LENGTH = 140;

// Mood 1 (rough) to 5 (great); the picker shows these
export const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

export const saveEntrySchema = z.object({
  // Left out for a new entry; the action creates it and returns the id
  id: z.string().min(1).optional(),
  content: z.string().max(MAX_ENTRY_LENGTH, "That entry is too long"),
  mood: z.number().int().min(1).max(5).nullable(),
});

export type SaveEntryInput = z.input<typeof saveEntrySchema>;

export const deleteEntrySchema = z.object({ id: z.string().min(1) });

// "8:41 PM" for when an entry was written, in the user's timezone
export function formatEntryTime(createdAt: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(createdAt);
}

export interface HistoryFilters {
  q: string;
  // "YYYY-MM", or "" for every month
  month: string;
  // 1 to 5, or null for any mood
  mood: number | null;
  // How many entries to show; "Show more" raises it
  limit: number;
}

type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value) ?? "";

// Reads the History filters from the URL; anything malformed falls back to "no filter"
export function parseHistoryParams(params: {
  q?: Param;
  month?: Param;
  mood?: Param;
  limit?: Param;
}): HistoryFilters {
  const month = first(params.month).trim();
  const mood = Number(first(params.mood));
  const limit = Number(first(params.limit));
  return {
    q: first(params.q).trim().slice(0, 60),
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "",
    mood: Number.isInteger(mood) && mood >= 1 && mood <= 5 ? mood : null,
    limit:
      Number.isInteger(limit) && limit > HISTORY_PAGE_SIZE
        ? Math.min(limit, 1000)
        : HISTORY_PAGE_SIZE,
  };
}

// The first day of a "YYYY-MM" month and of the month after it
export function monthRange(month: string): { from: DateKey; to: DateKey } {
  const [year, m] = month.split("-").map(Number);
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}

// "October 2026" for "2026-10"
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(toDbDate(`${month}-01`));
}

// "Tue, Oct 13" for a day
export function formatShortDate(day: DateKey): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(toDbDate(day));
}

// The start of an entry on one line, for the history list
export function previewText(content: string): string {
  const text = content.replace(/\s+/g, " ").trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;
}

// The query sorts newest first, so each month is one run of entries
export function groupByMonth<T extends { date: DateKey }>(
  entries: T[],
): { month: string; label: string; entries: T[] }[] {
  const groups: { month: string; label: string; entries: T[] }[] = [];
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.month === month) last.entries.push(entry);
    else groups.push({ month, label: monthLabel(month), entries: [entry] });
  }
  return groups;
}
