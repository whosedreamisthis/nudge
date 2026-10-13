import { addDays, weekStart, type DateKey } from "@/lib/dates";
import { getTodayProgress } from "@/lib/progress";
import { getTodayStats, type TodayStats } from "@/lib/stats";
import { getStreak, type Completion, type StreakTarget } from "@/lib/streaks";
import type { TodayHabit } from "@/types/habits";

// Development-only rows for looking at the Today page before habits can be added.
// Streaks and progress come from the real logic, fed with made-up completions.

const run = (from: DateKey, length: number, amount = 1): Completion[] =>
  Array.from({ length }, (_, i) => ({ date: addDays(from, i), amount }));

// `perWeek` completions at the start of each of the `count` weeks before the given Monday
const pastWeeks = (monday: DateKey, count: number, perWeek: number): Completion[] =>
  Array.from({ length: count }, (_, w) => run(addDays(monday, -7 * (w + 1)), perWeek)).flat();

const daily = (from: DateKey): StreakTarget => ({
  frequency: "DAILY",
  targetDaysPerWeek: 7,
  effectiveFrom: from,
});

const weekly = (perWeek: number, from: DateKey): StreakTarget => ({
  frequency: "WEEKLY",
  targetDaysPerWeek: perWeek,
  effectiveFrom: from,
});

interface SampleHabit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  categoryName: string;
  goal?: { amount: number; unit: string; step: number };
  targets: StreakTarget[];
  completions: Completion[];
}

export function getSampleToday(today: DateKey): {
  habits: TodayHabit[];
  stats: TodayStats;
} {
  const since = weekStart(addDays(today, -120));
  const thisMonday = weekStart(today);

  const habits: SampleHabit[] = [
    {
      // Complete: the 2000 ml goal reached today, 13 days running
      id: "s1",
      name: "Drink 2L of water",
      description: "Stay hydrated throughout the day.",
      icon: "💧",
      color: "sky",
      categoryName: "health",
      goal: { amount: 2000, unit: "ml", step: 250 },
      targets: [daily(since)],
      completions: run(addDays(today, -12), 13, 2000),
    },
    {
      // Complete today, and 12 weeks of 3 days a week behind it
      id: "s2",
      name: "Morning run",
      description: "30-minute run before breakfast.",
      icon: "🏃",
      color: "red",
      categoryName: "fitness",
      targets: [weekly(3, since)],
      completions: [...pastWeeks(thisMonday, 12, 3), ...run(thisMonday, 2)].filter(
        (c) => c.date <= today,
      ),
    },
    {
      // In progress: 10 of 20 minutes today, a 1 day streak from yesterday
      id: "s3",
      name: "Read 20 minutes",
      description: "Fiction or non-fiction, no phone.",
      icon: "📚",
      color: "violet",
      categoryName: "learning",
      goal: { amount: 20, unit: "min", step: 5 },
      targets: [daily(since)],
      completions: [
        { date: addDays(today, -1), amount: 20 },
        { date: today, amount: 10 },
      ],
    },
    {
      // Not started, and the streak broke 5 days ago
      id: "s4",
      name: "Journal",
      description: "Write 3 things I am grateful for.",
      icon: "✍️",
      color: "pink",
      categoryName: "mindfulness",
      targets: [daily(since)],
      completions: run(addDays(today, -10), 6),
    },
    {
      // Complete: 10 of 10 minutes, 4 days running
      id: "s5",
      name: "Meditate",
      description: "Ten quiet minutes, eyes closed, phone away.",
      icon: "🧘",
      color: "teal",
      categoryName: "mindfulness",
      goal: { amount: 10, unit: "min", step: 5 },
      targets: [daily(since)],
      completions: run(addDays(today, -3), 4, 10),
    },
    {
      // A brand new habit: not started, no streak
      id: "s6",
      name: "Plan tomorrow",
      description: "Pick the top three priorities before bed.",
      icon: "🗓️",
      color: "amber",
      categoryName: "productivity",
      targets: [daily(addDays(today, -2))],
      completions: [],
    },
  ];

  const entries = habits.map(({ name, icon, goal, targets, completions }) => ({
    name,
    icon,
    history: { completions, dailyGoal: goal?.amount ?? null, targets, today },
  }));

  const rows = habits.map(({ goal, targets, completions, ...habit }) => {
    const history = {
      completions,
      dailyGoal: goal?.amount ?? null,
      targets,
      today,
    };
    return {
      ...habit,
      unit: goal?.unit ?? null,
      stepSize: goal?.step ?? null,
      streak: getStreak(history),
      progress: getTodayProgress(history),
    };
  });

  return { habits: rows, stats: getTodayStats(entries) };
}
