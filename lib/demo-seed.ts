import { prisma } from "@/lib/db";
import { addDays, toDbDate, todayKey, weekDays, weekStart, type DateKey } from "@/lib/dates";
import type { HabitColor } from "@/types/habits";

// Sample data for a new demo account, relative to "now" in the user's timezone so the app looks alive.
// Later features that add user-created data extend this and its test.

const HISTORY_DAYS = 14 * 7;

export interface DemoHabitSpec {
  name: string;
  // Added from the catalog (linked to the system habit with this name) instead of being custom
  catalog: boolean;
  category: string;
  icon: string;
  description: string;
  color: HabitColor;
  frequency: "DAILY" | "WEEKLY";
  targetDaysPerWeek: number;
  goal?: { dailyGoal: number; unit: string; stepSize: number };
  // How many days of history it has, so habits don't all start on the same day
  startDaysAgo: number;
  // Chance of a daily habit being done on a normal day
  dailyOdds?: number;
  // Today's amount, or null to leave today open
  todayAmount: number | null;
}

export const DEMO_HABITS: DemoHabitSpec[] = [
  {
    name: "Take vitamins",
    catalog: true,
    category: "health",
    icon: "💊",
    description: "Take your daily vitamins",
    color: "emerald",
    frequency: "DAILY",
    targetDaysPerWeek: 7,
    startDaysAgo: HISTORY_DAYS - 1,
    dailyOdds: 0.88,
    todayAmount: 1,
  },
  {
    name: "Drink 2L of water",
    catalog: true,
    category: "health",
    icon: "💧",
    description: "Stay hydrated through the day",
    color: "sky",
    frequency: "DAILY",
    targetDaysPerWeek: 7,
    goal: { dailyGoal: 2000, unit: "ml", stepSize: 250 },
    startDaysAgo: HISTORY_DAYS - 1,
    dailyOdds: 0.8,
    todayAmount: 750,
  },
  {
    name: "Morning run",
    catalog: true,
    category: "fitness",
    icon: "🏃",
    description: "Start the day with a run",
    color: "amber",
    frequency: "WEEKLY",
    targetDaysPerWeek: 3,
    startDaysAgo: 10 * 7,
    todayAmount: null,
  },
  {
    name: "Read for 20 minutes",
    catalog: false,
    category: "learning",
    icon: "📚",
    description: "A chapter before bed",
    color: "violet",
    frequency: "DAILY",
    targetDaysPerWeek: 7,
    startDaysAgo: 12 * 7,
    dailyOdds: 0.68,
    todayAmount: null,
  },
  {
    name: "Call a friend",
    catalog: false,
    category: "social",
    icon: "📞",
    description: "Catch up with someone you care about",
    color: "pink",
    frequency: "WEEKLY",
    targetDaysPerWeek: 2,
    startDaysAgo: 9 * 7,
    todayAmount: null,
  },
];

export const DEMO_JOURNAL_ENTRIES = [
  { daysAgo: 1, mood: 4, content: "Good day. Got the run in before work and felt clear all afternoon." },
  { daysAgo: 3, mood: 3, content: "Quiet one. Missed my reading but called Sam, which was nice." },
  { daysAgo: 6, mood: 5, content: "Best week in a while. Streaks are starting to feel easy." },
  { daysAgo: 10, mood: 2, content: "Tired and a bit flat. Kept the small habits going anyway." },
];

// Small seeded random generator: the same seed gives the same demo, which keeps tests stable
export function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlannedCompletion {
  date: DateKey;
  amount: number;
}

// A day-by-day history for one habit: gaps and slumps for daily habits, a few days a week for weekly ones
export function planCompletions(
  spec: DemoHabitSpec,
  today: DateKey,
  random: () => number,
): PlannedCompletion[] {
  const start = addDays(today, -spec.startDaysAgo);
  const days: DateKey[] = [];
  for (let day = start; day <= today; day = addDays(day, 1)) days.push(day);

  const planned =
    spec.frequency === "DAILY" ? planDaily(spec, days, random) : planWeekly(spec, days, today, random);

  // Today is set by hand so the Today page shows both finished and open habits
  const withoutToday = planned.filter((entry) => entry.date !== today);
  return spec.todayAmount === null ? withoutToday : [...withoutToday, { date: today, amount: spec.todayAmount }];
}

function doneAmount(spec: DemoHabitSpec, random: () => number): number {
  if (!spec.goal) return 1;
  // Mostly the full goal, sometimes a bit short, always a whole number of steps
  if (random() < 0.75) return spec.goal.dailyGoal;
  const steps = spec.goal.dailyGoal / spec.goal.stepSize;
  return spec.goal.stepSize * (1 + Math.floor(random() * (steps - 1)));
}

function planDaily(spec: DemoHabitSpec, days: DateKey[], random: () => number): PlannedCompletion[] {
  // Two slumps of a few days each, so the streaks have breaks to recover from
  const slumps = [0, 1].map(() => {
    const first = Math.floor(random() * Math.max(1, days.length - 6));
    return { first, last: first + 3 + Math.floor(random() * 3) };
  });

  return days.flatMap((date, index) => {
    const inSlump = slumps.some((slump) => index >= slump.first && index <= slump.last);
    const odds = inSlump ? 0.1 : (spec.dailyOdds ?? 0.8);
    return random() < odds ? [{ date, amount: doneAmount(spec, random) }] : [];
  });
}

function planWeekly(
  spec: DemoHabitSpec,
  days: DateKey[],
  today: DateKey,
  random: () => number,
): PlannedCompletion[] {
  const first = days[0];
  const planned: PlannedCompletion[] = [];

  for (let monday = weekStart(first); monday <= today; monday = addDays(monday, 7)) {
    // Past days only: today is handled by the caller
    const pool = weekDays(monday).filter((day) => day >= first && day < today);
    // Most weeks hit the target, some fall one short; the current week is part way there
    const short = monday === weekStart(today) ? 1 : random() < 0.2 ? 1 : 0;
    const count = Math.max(0, spec.targetDaysPerWeek - short);
    for (let n = 0; n < count && pool.length > 0; n++) {
      const [date] = pool.splice(Math.floor(random() * pool.length), 1);
      planned.push({ date, amount: 1 });
    }
  }
  return planned;
}

export interface SeedDemoInput {
  userId: string;
  timezone: string;
  now?: Date;
  seed?: number;
}

type SeedDb = Pick<typeof prisma, "habit" | "habitCompletion" | "journalEntry" | "systemHabit" | "category">;

// Writes the sample habits, about 14 weeks of completions and a few journal entries for a demo user.
// The catalog has to be seeded first (npm run db:seed). If this throws, the caller deletes the user.
export async function seedDemoUser(
  { userId, timezone, now = new Date(), seed = 1 }: SeedDemoInput,
  db: SeedDb = prisma,
) {
  const today = todayKey(timezone, now);
  const random = makeRandom(seed);

  const [systemHabits, categories] = await Promise.all([
    db.systemHabit.findMany({
      where: { name: { in: DEMO_HABITS.filter((spec) => spec.catalog).map((spec) => spec.name) } },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      where: { name: { in: [...new Set(DEMO_HABITS.map((spec) => spec.category))] } },
      select: { id: true, name: true },
    }),
  ]);
  const categoryIds = new Map(categories.map((category) => [category.name, category.id]));

  for (const spec of DEMO_HABITS) {
    const categoryId = categoryIds.get(spec.category);
    if (!categoryId) throw new Error(`Demo seed: category "${spec.category}" not found. Run npm run db:seed.`);

    const start = addDays(today, -spec.startDaysAgo);
    const habit = await db.habit.create({
      data: {
        userId,
        systemHabitId: spec.catalog ? systemHabits.find((system) => system.name === spec.name)?.id : undefined,
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        color: spec.color,
        categoryId,
        dailyGoal: spec.goal?.dailyGoal ?? null,
        unit: spec.goal?.unit ?? null,
        stepSize: spec.goal?.stepSize ?? null,
        createdAt: toDbDate(start),
        targets: {
          create: {
            frequency: spec.frequency,
            targetDaysPerWeek: spec.targetDaysPerWeek,
            effectiveFrom: toDbDate(weekStart(start)),
          },
        },
      },
      select: { id: true },
    });

    await db.habitCompletion.createMany({
      data: planCompletions(spec, today, random).map(({ date, amount }) => ({
        habitId: habit.id,
        userId,
        date: toDbDate(date),
        amount,
      })),
      skipDuplicates: true,
    });
  }

  await db.journalEntry.createMany({
    data: DEMO_JOURNAL_ENTRIES.map(({ daysAgo, mood, content }) => {
      const date = addDays(today, -daysAgo);
      // Evening by the UTC clock; close enough for sample entries
      return { userId, date: toDbDate(date), mood, content, createdAt: new Date(`${date}T20:15:00.000Z`) };
    }),
  });
}
