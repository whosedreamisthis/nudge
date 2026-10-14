import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays, fromDbDate, weekStart } from "@/lib/dates";
import {
  DEMO_HABITS,
  DEMO_JOURNAL_ENTRIES,
  makeRandom,
  planCompletions,
  seedDemoUser,
} from "@/lib/demo-seed";

const NOW = new Date("2026-10-14T12:00:00Z");
const TODAY = "2026-10-14";

const spec = (name: string) => DEMO_HABITS.find((habit) => habit.name === name)!;

describe("makeRandom", () => {
  it("gives the same numbers for the same seed", () => {
    const a = makeRandom(7);
    const b = makeRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("stays between 0 and 1", () => {
    const random = makeRandom(3);
    for (let i = 0; i < 200; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("DEMO_HABITS", () => {
  it("has a daily, a multi-step and a weekly 3 days a week habit", () => {
    expect(DEMO_HABITS).toHaveLength(5);
    expect(DEMO_HABITS.some((habit) => habit.frequency === "DAILY" && !habit.goal)).toBe(true);
    expect(DEMO_HABITS.some((habit) => habit.goal?.unit === "ml")).toBe(true);
    expect(DEMO_HABITS.some((habit) => habit.frequency === "WEEKLY" && habit.targetDaysPerWeek === 3)).toBe(true);
    expect(DEMO_HABITS.some((habit) => habit.catalog)).toBe(true);
    expect(DEMO_HABITS.some((habit) => !habit.catalog)).toBe(true);
  });
});

describe("planCompletions", () => {
  it("is the same for the same seed", () => {
    const first = planCompletions(spec("Take vitamins"), TODAY, makeRandom(1));
    const second = planCompletions(spec("Take vitamins"), TODAY, makeRandom(1));
    expect(first).toEqual(second);
  });

  it("stays between the habit's start and today, one entry per day", () => {
    for (const habit of DEMO_HABITS) {
      const dates = planCompletions(habit, TODAY, makeRandom(1)).map((entry) => entry.date);
      const start = addDays(TODAY, -habit.startDaysAgo);
      expect(dates.every((date) => date >= start && date <= TODAY)).toBe(true);
      expect(new Set(dates).size).toBe(dates.length);
    }
  });

  it("has realistic gaps: most daily days done, but not all", () => {
    const entries = planCompletions(spec("Take vitamins"), TODAY, makeRandom(1));
    expect(entries.length).toBeGreaterThan(60);
    expect(entries.length).toBeLessThan(97);
  });

  it("gives the water habit whole steps up to its goal, and 750 ml today", () => {
    const entries = planCompletions(spec("Drink 2L of water"), TODAY, makeRandom(1));
    for (const { amount } of entries) {
      expect(amount % 250).toBe(0);
      expect(amount).toBeGreaterThan(0);
      expect(amount).toBeLessThanOrEqual(2000);
    }
    expect(entries.find((entry) => entry.date === TODAY)?.amount).toBe(750);
    expect(entries.some((entry) => entry.amount === 2000)).toBe(true);
  });

  it("never plans more than the weekly target, and leaves today open for the run", () => {
    const entries = planCompletions(spec("Morning run"), TODAY, makeRandom(1));
    const perWeek = new Map<string, number>();
    for (const { date } of entries) perWeek.set(weekStart(date), (perWeek.get(weekStart(date)) ?? 0) + 1);

    expect(Math.max(...perWeek.values())).toBeLessThanOrEqual(3);
    expect(perWeek.size).toBeGreaterThan(5);
    expect(entries.some((entry) => entry.date === TODAY)).toBe(false);
  });
});

describe("seedDemoUser", () => {
  const habitCreate = vi.fn();
  const completionCreateMany = vi.fn();
  const journalCreateMany = vi.fn();
  const systemHabitFindMany = vi.fn();
  const categoryFindMany = vi.fn();

  const db = {
    habit: { create: habitCreate },
    habitCompletion: { createMany: completionCreateMany },
    journalEntry: { createMany: journalCreateMany },
    systemHabit: { findMany: systemHabitFindMany },
    category: { findMany: categoryFindMany },
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    let n = 0;
    habitCreate.mockImplementation(async () => ({ id: `h${++n}` }));
    systemHabitFindMany.mockResolvedValue([
      { id: "s1", name: "Take vitamins" },
      { id: "s2", name: "Drink 2L of water" },
      { id: "s3", name: "Morning run" },
    ]);
    categoryFindMany.mockResolvedValue(
      ["health", "fitness", "learning", "social"].map((name) => ({ id: `cat_${name}`, name })),
    );
  });

  const seed = () => seedDemoUser({ userId: "u1", timezone: "UTC", now: NOW }, db);

  it("creates the five habits for the user, each with a target from its first week", async () => {
    await seed();

    expect(habitCreate).toHaveBeenCalledTimes(5);
    const first = habitCreate.mock.calls[0][0].data;
    expect(first).toMatchObject({ userId: "u1", name: "Take vitamins", systemHabitId: "s1", categoryId: "cat_health" });
    expect(first.targets.create).toMatchObject({ frequency: "DAILY", targetDaysPerWeek: 7 });
    expect(fromDbDate(first.targets.create.effectiveFrom)).toBe(weekStart(addDays(TODAY, -97)));
  });

  it("links catalog habits to their system habit and leaves custom ones unlinked", async () => {
    await seed();

    const data = habitCreate.mock.calls.map((call) => call[0].data);
    expect(data.find((habit) => habit.name === "Morning run").systemHabitId).toBe("s3");
    expect(data.find((habit) => habit.name === "Read for 20 minutes").systemHabitId).toBeUndefined();
  });

  it("gives the water habit its goal, unit and step", async () => {
    await seed();

    const water = habitCreate.mock.calls.map((call) => call[0].data).find((habit) => habit.name === "Drink 2L of water");
    expect(water).toMatchObject({ dailyGoal: 2000, unit: "ml", stepSize: 250 });
  });

  it("writes about 14 weeks of completions per habit, all for this user and habit", async () => {
    await seed();

    expect(completionCreateMany).toHaveBeenCalledTimes(5);
    const [vitamins] = completionCreateMany.mock.calls[0];
    expect(vitamins.skipDuplicates).toBe(true);
    expect(vitamins.data.length).toBeGreaterThan(60);
    expect(vitamins.data.every((row: { userId: string; habitId: string }) => row.userId === "u1" && row.habitId === "h1")).toBe(true);
  });

  it("writes a few journal entries on recent days", async () => {
    await seed();

    const rows = journalCreateMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(DEMO_JOURNAL_ENTRIES.length);
    expect(rows.every((row: { userId: string; mood: number }) => row.userId === "u1" && row.mood >= 1 && row.mood <= 5)).toBe(true);
    expect(fromDbDate(rows[0].date)).toBe(addDays(TODAY, -1));
  });

  it("uses the user's local day, not the server's", async () => {
    // 2026-10-14 12:00 UTC is already the 15th in Auckland
    await seedDemoUser({ userId: "u1", timezone: "Pacific/Auckland", now: NOW }, db);

    const rows = journalCreateMany.mock.calls[0][0].data;
    expect(fromDbDate(rows[0].date)).toBe("2026-10-14");
  });

  it("fails clearly when the catalog has not been seeded", async () => {
    categoryFindMany.mockResolvedValue([]);

    await expect(seed()).rejects.toThrow("npm run db:seed");
    expect(habitCreate).not.toHaveBeenCalled();
  });
});
