"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { todayKey, toDbDate, weekStart } from "@/lib/dates";
import { createHabitSchema, type CreateHabitInput } from "@/lib/habit-form";
import { getSessionUser } from "@/lib/session";
import { advanceAmount } from "@/lib/progress";
import type { ActionResult } from "@/types/actions";

const advanceSchema = z.object({ habitId: z.string().min(1) });

// One tap on a habit for the user's local today. A simple habit flips between done and not done;
// a habit with a daily goal moves up by its step size, and a tap on a finished day clears it.
export async function advanceHabit(
  input: z.input<typeof advanceSchema>,
): Promise<ActionResult<{ amount: number }>> {
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid habit" };

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const habit = await prisma.habit.findFirst({
    where: { id: parsed.data.habitId, userId: user.id, archivedAt: null },
    select: { id: true, dailyGoal: true, stepSize: true },
  });
  if (!habit) return { success: false, error: "Habit not found" };

  const date = toDbDate(todayKey(user.timezone));
  const where = { habitId_date: { habitId: habit.id, date } };
  const existing = await prisma.habitCompletion.findUnique({ where });
  const amount = advanceAmount(existing?.amount ?? 0, habit.dailyGoal, habit.stepSize);

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

  revalidatePath("/today");
  return { success: true, data: { amount } };
}

// Creates a custom habit (no system habit) with its first target, effective from this week
export async function createHabit(
  input: CreateHabitInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createHabitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid habit" };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const { frequency, targetDaysPerWeek, ...fields } = parsed.data;
  const category = await prisma.category.findUnique({
    where: { id: fields.categoryId },
    select: { id: true },
  });
  if (!category) return { success: false, error: "Category not found" };

  try {
    const habit = await prisma.habit.create({
      data: {
        ...fields,
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
    revalidatePath("/today");
    revalidatePath("/habits");
    return { success: true, data: { id: habit.id } };
  } catch {
    return { success: false, error: "Could not create the habit, try again" };
  }
}
