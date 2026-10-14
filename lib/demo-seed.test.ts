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
  const habitCreateMany = vi.fn();
  const targetCreateMany = vi.fn();
  const completionCreateMany = vi.fn();
  const journalCreateMany = vi.fn();
  const systemHabitFindMany = vi.fn();
  const categoryFindMany = vi.fn();

  const db = {
    habit: { createMany: habitCreateMany },
    habitTarget: { createMany: targetCreateMany },
    habitCompletion: { createMany: completionCreateMany },
    journalEntry: { createMany: journalCreateMany },
    systemHabit: { findMany: systemHabitFindMany },
    category: { findMany: categoryFindMany },
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [habitCreateMany, targetCreateMany, completionCreateMany, journalCreateMany]) {
      mock.mockResolvedValue({ count: 0 });
    }
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
  const habitRows = () => habitCreateMany.mock.calls[0][0].data as Record<string, unknown>[];

  it("inserts each kind of row with one bulk call, so a demo needs few round trips", async () => {
    await seed();

    expect(habitCreateMany).toHaveBeenCalledTimes(1);
    expect(targetCreateMany).toHaveBeenCalledTimes(1);
    expect(completionCreateMany).toHaveBeenCalledTimes(1);
    expect(journalCreateMany).toHaveBeenCalledTimes(1);
  });

  it("writes the habits before the rows that point at them", async () => {
    const order: string[] = [];
    habitCreateMany.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push("habits");
    });
    targetCreateMany.mockImplementation(async () => order.push("targets"));
    completionCreateMany.mockImplementation(async () => order.push("completions"));

    await seed();

    expect(order[0]).toBe("habits");
    expect(order).toHaveLength(3);
  });

  it("creates the five habits for the user with ids made up front", async () => {
    await seed();

    const rows = habitRows();
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.userId === "u1" && typeof row.id === "string" && row.id.length > 0)).toBe(true);
    expect(new Set(rows.map((row) => row.id)).size).toBe(5);
    expect(rows[0]).toMatchObject({ name: "Take vitamins", systemHabitId: "s1", categoryId: "cat_health" });
  });

  it("links catalog habits to their system habit and leaves custom ones unlinked", async () => {
    await seed();

    const rows = habitRows();
    expect(rows.find((row) => row.name === "Morning run")!.systemHabitId).toBe("s3");
    expect(rows.find((row) => row.name === "Read for 20 minutes")!.systemHabitId).toBeNull();
  });

  it("gives the water habit its goal, unit and step", async () => {
    await seed();

    expect(habitRows().find((row) => row.name === "Drink 2L of water")).toMatchObject({
      dailyGoal: 2000,
      unit: "ml",
      stepSize: 250,
    });
  });

  it("gives every habit one target from the week it started", async () => {
    await seed();

    const ids = habitRows().map((row) => row.id);
    const targets = targetCreateMany.mock.calls[0][0].data as Record<string, unknown>[];
    expect(targets.map((target) => target.habitId)).toEqual(ids);
    expect(targets[0]).toMatchObject({ frequency: "DAILY", targetDaysPerWeek: 7 });
    expect(fromDbDate(targets[0].effectiveFrom as Date)).toBe(weekStart(addDays(TODAY, -97)));
    expect(targets[2]).toMatchObject({ frequency: "WEEKLY", targetDaysPerWeek: 3 });
  });

  it("writes about 14 weeks of completions, all for this user and one of the habits", async () => {
    await seed();

    const ids = new Set(habitRows().map((row) => row.id));
    const [{ data, skipDuplicates }] = completionCreateMany.mock.calls[0];
    expect(skipDuplicates).toBe(true);
    expect(data.length).toBeGreaterThan(150);
    expect(data.every((row: { userId: string; habitId: string }) => row.userId === "u1" && ids.has(row.habitId))).toBe(true);
  });

  it("writes a few journal entries on recent days", async () => {
    await seed();

    const rows = journalCreateMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(DEMO_JOURNAL_ENTRIES.length);
    expect(rows.every((row: { userId: string; mood: number }) => row.userId === "u1" && row.mood >= 1 && row.mood <= 5)).toBe(true);
    expect(fromDbDate(rows[0].date)).toBe(addDays(TODAY, -1));
  });

  it("makes the same demo for the same seed, apart from the ids", async () => {
    await seed();
    const first = completionCreateMany.mock.calls[0][0].data.map((row: { date: Date; amount: number }) => [row.date, row.amount]);
    vi.clearAllMocks();
    await seed();
    const second = completionCreateMany.mock.calls[0][0].data.map((row: { date: Date; amount: number }) => [row.date, row.amount]);

    expect(second).toEqual(first);
  });

  it("uses the user's local day, not the server's", async () => {
    // 2026-10-14 12:00 UTC is already the 15th in Auckland
    await seedDemoUser({ userId: "u1", timezone: "Pacific/Auckland", now: NOW }, db);

    const rows = journalCreateMany.mock.calls[0][0].data;
    expect(fromDbDate(rows[0].date)).toBe("2026-10-14");
  });

  it("fails clearly when the catalog has not been seeded, before writing anything", async () => {
    categoryFindMany.mockResolvedValue([]);

    await expect(seed()).rejects.toThrow("npm run db:seed");
    expect(habitCreateMany).not.toHaveBeenCalled();
    expect(journalCreateMany).not.toHaveBeenCalled();
  });

  it("does not write the rows that depend on habits when the habits fail", async () => {
    habitCreateMany.mockRejectedValue(new Error("db is down"));

    await expect(seed()).rejects.toThrow("db is down");
    expect(targetCreateMany).not.toHaveBeenCalled();
    expect(completionCreateMany).not.toHaveBeenCalled();
  });
});
