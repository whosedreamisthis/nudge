"use server";

import { revalidatePath } from "next/cache";
import { expireCompletions, expireHabitData } from "@/lib/cache-tags";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fromDbDate, todayKey, toDbDate, weekStart } from "@/lib/dates";
import {
  createHabitSchema,
  goalData,
  setAmountSchema,
  updateHabitSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
} from "@/lib/habit-form";
import { focusAmount, MAX_MINUTES } from "@/lib/focus";
import { planTargetChange } from "@/lib/targets";
import { getSessionUser } from "@/lib/session";
import { advanceAmount, undoAmount } from "@/lib/progress";
import type { ActionResult } from "@/types/actions";

const habitIdSchema = z.object({ habitId: z.string().min(1) });

const focusCompleteSchema = z.object({
  habitId: z.string().min(1),
  minutes: z.number().int().min(1).max(MAX_MINUTES),
});

// Loads the user's active habit and its completion for their local today, then saves the amount
// `next` returns (0 removes the completion; null means the change does not apply to this habit)
async function changeAmount(
  habitId: string,
  next: (
    current: number,
    habit: { dailyGoal: number | null; stepSize: number | null; unit: string | null },
  ) => number | null,
): Promise<ActionResult<{ amount: number }>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id, archivedAt: null },
    select: { id: true, dailyGoal: true, stepSize: true, unit: true },
  });
  if (!habit) return { success: false, error: "Habit not found" };

  const date = toDbDate(todayKey(user.timezone));
  const where = { habitId_date: { habitId: habit.id, date } };
  const existing = await prisma.habitCompletion.findUnique({ where });
  const amount = next(existing?.amount ?? 0, habit);
  if (amount === null)
    return { success: false, error: "This habit has no daily goal" };

  try {
    if (amount === 0) {
      // Nothing to delete when there was no completion yet
      if (existing) await prisma.habitCompletion.delete({ where });
    } else {
      await prisma.habitCompletion.upsert({
        where,
        update: { amount },
        create: { habitId: habit.id, userId: user.id, date, amount },
      });
    }
  } catch {
    return { success: false, error: "Could not save, try again" };
  }

  expireCompletions(user.id);
  revalidatePath("/today");
  return { success: true, data: { amount } };
}

// One tap on a habit for the user's local today. A simple habit flips between done and not done;
// a habit with a daily goal moves up by its step size, and a tap on a finished day clears it.
export async function advanceHabit(
  input: z.input<typeof habitIdSchema>,
): Promise<ActionResult<{ amount: number }>> {
  const parsed = habitIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  return changeAmount(parsed.data.habitId, (amount, habit) =>
    advanceAmount(amount, habit.dailyGoal, habit.stepSize),
  );
}

// Takes one step back from today's amount; reaching 0 removes the completion
export async function undoHabit(
  input: z.input<typeof habitIdSchema>,
): Promise<ActionResult<{ amount: number }>> {
  const parsed = habitIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  return changeAmount(parsed.data.habitId, (amount, habit) =>
    undoAmount(amount, habit.stepSize),
  );
}

// Sets today's amount for a habit with a daily goal; it can go past the goal, and 0 removes it
export async function setHabitAmount(
  input: z.input<typeof setAmountSchema>,
): Promise<ActionResult<{ amount: number }>> {
  const parsed = setAmountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid amount",
    };
  }

  return changeAmount(parsed.data.habitId, (_, habit) =>
    habit.dailyGoal === null ? null : parsed.data.amount,
  );
}

// A finished Focus session counts for its linked habit today. It only ever adds: a habit that is
// already done stays done, so confirming twice is harmless.
export async function completeHabitFromFocus(
  input: z.input<typeof focusCompleteSchema>,
): Promise<ActionResult<{ amount: number }>> {
  const parsed = focusCompleteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid session" };

  return changeAmount(parsed.data.habitId, (amount, habit) =>
    focusAmount(amount, habit, parsed.data.minutes),
  );
}

// Creates a habit, custom or linked to a catalog habit, with its first target, effective from this week
export async function createHabit(
  input: CreateHabitInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createHabitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid habit",
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const {
    frequency,
    targetDaysPerWeek,
    systemHabitId,
    dailyGoal,
    unit,
    stepSize,
    ...fields
  } = parsed.data;
  const category = await prisma.category.findUnique({
    where: { id: fields.categoryId },
    select: { id: true },
  });
  if (!category) return { success: false, error: "Category not found" };

  if (systemHabitId) {
    const system = await prisma.systemHabit.findUnique({
      where: { id: systemHabitId },
      select: { id: true },
    });
    if (!system) return { success: false, error: "Habit not found" };
    const added = await prisma.habit.findFirst({
      where: { userId: user.id, systemHabitId, archivedAt: null },
      select: { id: true },
    });
    if (added) return { success: false, error: "You already added this habit" };
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        ...fields,
        ...goalData({ dailyGoal, unit, stepSize }),
        ...(systemHabitId && { systemHabitId }),
        userId: user.id,
        targets: {
          create: {
            frequency,
            targetDaysPerWeek: frequency === "DAILY" ? 7 : targetDaysPerWeek,
            effectiveFrom: toDbDate(weekStart(todayKey(user.timezone))),
          },
        },
      },
      select: { id: true },
    });
    expireHabitData(user.id);
    revalidatePath("/today");
    revalidatePath("/habits");
    return { success: true, data: { id: habit.id } };
  } catch {
    return { success: false, error: "Could not create the habit, try again" };
  }
}

// Edits a habit's details. A changed target starts this week, so past weeks keep the target they had.
export async function updateHabit(
  input: UpdateHabitInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateHabitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid habit",
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const {
    habitId,
    frequency,
    targetDaysPerWeek,
    dailyGoal,
    unit,
    stepSize,
    ...fields
  } = parsed.data;
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id, archivedAt: null },
    select: {
      id: true,
      targets: {
        select: {
          id: true,
          frequency: true,
          targetDaysPerWeek: true,
          effectiveFrom: true,
        },
      },
    },
  });
  if (!habit) return { success: false, error: "Habit not found" };

  const category = await prisma.category.findUnique({
    where: { id: fields.categoryId },
    select: { id: true },
  });
  if (!category) return { success: false, error: "Category not found" };

  const days = frequency === "DAILY" ? 7 : targetDaysPerWeek;
  const week = weekStart(todayKey(user.timezone));
  const change = planTargetChange(
    habit.targets.map((t) => ({
      ...t,
      effectiveFrom: fromDbDate(t.effectiveFrom),
    })),
    week,
    { frequency, targetDaysPerWeek: days },
  );

  try {
    await prisma.habit.update({
      where: { id: habit.id },
      data: {
        ...fields,
        // A new goal counts from now on; days already recorded keep their amounts
        ...goalData({ dailyGoal, unit, stepSize }),
        ...(change.type === "create" && {
          targets: {
            create: {
              frequency,
              targetDaysPerWeek: days,
              effectiveFrom: toDbDate(week),
            },
          },
        }),
        ...(change.type === "update" && {
          targets: {
            update: {
              where: { id: change.id },
              data: { frequency, targetDaysPerWeek: days },
            },
          },
        }),
      },
    });
  } catch {
    return { success: false, error: "Could not save the habit, try again" };
  }

  expireHabitData(user.id);

  revalidatePath("/today");
  revalidatePath("/habits");
  return { success: true, data: { id: habit.id } };
}

// Hides the habit from Today and stats; its history stays
export async function archiveHabit(
  input: z.input<typeof habitIdSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = habitIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  try {
    const { count } = await prisma.habit.updateMany({
      where: { id: parsed.data.habitId, userId: user.id, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (count === 0) return { success: false, error: "Habit not found" };
  } catch {
    return { success: false, error: "Could not archive the habit, try again" };
  }

  expireHabitData(user.id);

  revalidatePath("/today");
  revalidatePath("/habits");
  return { success: true, data: { id: parsed.data.habitId } };
}

// Removes a custom habit with its completions and targets. Catalog habits can only be archived,
// so this is checked here and not only by hiding the menu item.
export async function deleteHabit(
  input: z.input<typeof habitIdSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = habitIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const habit = await prisma.habit.findFirst({
    where: { id: parsed.data.habitId, userId: user.id },
    select: { id: true, systemHabitId: true },
  });
  if (!habit) return { success: false, error: "Habit not found" };
  if (habit.systemHabitId) {
    return {
      success: false,
      error: "Catalog habits can't be deleted, archive it instead",
    };
  }

  try {
    // The guard on systemHabitId repeats the check above in the same statement
    await prisma.habit.deleteMany({
      where: { id: habit.id, userId: user.id, systemHabitId: null },
    });
  } catch {
    return { success: false, error: "Could not delete the habit, try again" };
  }

  expireHabitData(user.id);

  revalidatePath("/today");
  revalidatePath("/habits");
  return { success: true, data: { id: habit.id } };
}

// Puts an archived habit back on Today with all its history
export async function restoreHabit(
  input: z.input<typeof habitIdSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = habitIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const habit = await prisma.habit.findFirst({
    where: {
      id: parsed.data.habitId,
      userId: user.id,
      archivedAt: { not: null },
    },
    select: { id: true, systemHabitId: true },
  });
  if (!habit) return { success: false, error: "Habit not found" };

  // A catalog habit added again while this one was archived: two active copies would be a duplicate
  if (habit.systemHabitId) {
    const active = await prisma.habit.findFirst({
      where: {
        userId: user.id,
        systemHabitId: habit.systemHabitId,
        archivedAt: null,
      },
      select: { id: true },
    });
    if (active) return { success: false, error: "You already have this habit" };
  }

  try {
    // Today's completion goes in the same write, so the habit comes back as not done.
    // Earlier days stay: the history is the point of archiving instead of deleting.
    await prisma.habit.update({
      where: { id: habit.id },
      data: {
        archivedAt: null,
        completions: {
          deleteMany: { date: toDbDate(todayKey(user.timezone)) },
        },
      },
    });
  } catch {
    return { success: false, error: "Could not restore the habit, try again" };
  }

  expireHabitData(user.id);

  revalidatePath("/today");
  revalidatePath("/habits");
  return { success: true, data: { id: habit.id } };
}
