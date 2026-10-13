// A user-local calendar day as "YYYY-MM-DD". It matches the @db.Date columns, so a day never
// shifts with the server's timezone. Weeks run Monday to Sunday.
export type DateKey = string;

const MS_PER_DAY = 86_400_000;

// Day arithmetic happens in UTC, where there are no daylight-saving jumps
function toMs(key: DateKey) {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromMs(ms: number): DateKey {
  return new Date(ms).toISOString().slice(0, 10);
}

// The calendar day an instant falls on in the given IANA timezone
export function toDateKey(instant: Date, timeZone: string): DateKey {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  return toDateKey(now, timeZone);
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromMs(toMs(key) + days * MS_PER_DAY);
}

// Whole days from `from` to `to` (negative when `to` is earlier)
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((toMs(to) - toMs(from)) / MS_PER_DAY);
}

// The Monday of the week containing the day
export function weekStart(key: DateKey): DateKey {
  const sinceMonday = (new Date(toMs(key)).getUTCDay() + 6) % 7;
  return addDays(key, -sinceMonday);
}

// The seven days of the week containing the day, Monday first
export function weekDays(key: DateKey): DateKey[] {
  const monday = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Prisma returns @db.Date columns as a Date at UTC midnight
export function fromDbDate(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

export function toDbDate(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}
