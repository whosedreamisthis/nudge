import { addDays, weekDays, weekStart, type DateKey } from "@/lib/dates";

// Pure functions over plain data: callers load completions and targets and pass them in.

export type Completion = { date: DateKey; amount: number };

export type StreakTarget = {
  frequency: "DAILY" | "WEEKLY";
  targetDaysPerWeek: number;
  // User-local Monday the target applies from
  effectiveFrom: DateKey;
};

export type StreakInput = {
  completions: Completion[];
  dailyGoal: number | null;
  targets: StreakTarget[];
  today: DateKey;
};

// `unit` says what the numbers count: days for daily habits, weeks for weekly ones
export type Streak = { unit: "day" | "week"; current: number; best: number };

// A day counts only once the goal is reached (a simple habit has a goal of 1)
export function isDayComplete(amount: number, dailyGoal: number | null) {
  return amount >= (dailyGoal ?? 1);
}

export function completedDays(completions: Completion[], dailyGoal: number | null) {
  const totals = new Map<DateKey, number>();
  for (const { date, amount } of completions) {
    totals.set(date, (totals.get(date) ?? 0) + amount);
  }
  const days = new Set<DateKey>();
  for (const [date, amount] of totals) {
    if (isDayComplete(amount, dailyGoal)) days.add(date);
  }
  return days;
}

// The target in effect for a week: the newest one starting on or before it (null before the first)
export function targetForWeek(targets: StreakTarget[], week: DateKey): StreakTarget | null {
  let found: StreakTarget | null = null;
  for (const target of targets) {
    if (target.effectiveFrom <= week && (!found || target.effectiveFrom > found.effectiveFrom)) {
      found = target;
    }
  }
  return found;
}

export function completedInWeek(days: Set<DateKey>, day: DateKey) {
  return weekDays(day).filter((d) => days.has(d)).length;
}

export function isWeekComplete(days: Set<DateKey>, day: DateKey, targetDaysPerWeek: number) {
  return completedInWeek(days, day) >= targetDaysPerWeek;
}

function dayStreak(days: Set<DateKey>, today: DateKey): Streak {
  const past = [...days].filter((d) => d <= today).sort();

  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const day of past) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  // Today is still open: an unchecked today doesn't break a streak that reaches yesterday
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { unit: "day", current, best };
}

function weekStreak(days: Set<DateKey>, targets: StreakTarget[], today: DateKey): Streak {
  const thisWeek = weekStart(today);
  const firstWeek = targets.map((t) => weekStart(t.effectiveFrom)).sort()[0];
  if (!firstWeek) return { unit: "week", current: 0, best: 0 };

  let best = 0;
  let run = 0;
  for (let week = firstWeek; week <= thisWeek; week = addDays(week, 7)) {
    const target = targetForWeek(targets, week);
    const complete = target !== null && isWeekComplete(days, week, target.targetDaysPerWeek);

    if (complete) {
      run++;
      best = Math.max(best, run);
    } else if (week !== thisWeek) {
      run = 0;
    }
    // An unfinished current week is not a miss yet: it neither adds to nor resets the run
  }

  return { unit: "week", current: run, best };
}

// Day streak for daily habits and week streak for weekly ones, by the target in effect this week
export function getStreak({ completions, dailyGoal, targets, today }: StreakInput): Streak {
  const days = completedDays(completions, dailyGoal);
  const target = targetForWeek(targets, weekStart(today));

  return target?.frequency === "WEEKLY"
    ? weekStreak(days, targets, today)
    : dayStreak(days, today);
}
