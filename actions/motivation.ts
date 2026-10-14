"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { todayKey, toDbDate } from "@/lib/dates";
import { getMotivation, getRecentHistory } from "@/lib/db/motivation";
import { generateJson, isAiDisabled } from "@/lib/gemini";
import {
  buildMotivationPrompt,
  mockMotivation,
  motivationReplySchema,
  motivationResponseSchema,
  type StoredMotivation,
} from "@/lib/motivation";
import { getAiSettings } from "@/lib/ai-settings";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

// Returns today's message, generating it once per user per day. With no history yet the message
// is a general one.
export async function generateMotivation(): Promise<ActionResult<StoredMotivation | null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (!(await getAiSettings(user)).motivation) return { success: false, error: "AI features are turned off in Settings" };

  const today = todayKey(user.timezone);

  try {
    const existing = await getMotivation(user.id, today);
    if (existing) return { success: true, data: existing };

    const habits = await getRecentHistory(user.id, today);

    const raw = isAiDisabled()
      ? mockMotivation(habits)
      : await generateJson(buildMotivationPrompt(habits, today), motivationResponseSchema);
    const reply = motivationReplySchema.safeParse(raw);
    if (!reply.success) return { success: false, error: "Could not read the message" };

    const content = { message: reply.data.message, dismissed: false };
    // Two tabs can race here; the empty update keeps the first message, which is read back below
    await prisma.aiReport.upsert({
      where: {
        userId_type_periodStart: {
          userId: user.id,
          type: "MOTIVATION",
          periodStart: toDbDate(today),
        },
      },
      create: { userId: user.id, type: "MOTIVATION", periodStart: toDbDate(today), content },
      update: {},
    });

    return { success: true, data: (await getMotivation(user.id, today)) ?? content };
  } catch (error) {
    console.error("Could not generate the morning motivation:", error);
    return { success: false, error: "Could not load your message" };
  }
}

// Hides today's message; tomorrow gets a new one
export async function dismissMotivation(): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };

  const today = todayKey(user.timezone);

  try {
    const existing = await getMotivation(user.id, today);
    if (existing) {
      await prisma.aiReport.update({
        where: {
          userId_type_periodStart: {
            userId: user.id,
            type: "MOTIVATION",
            periodStart: toDbDate(today),
          },
        },
        data: { content: { ...existing, dismissed: true } },
      });
    }
    revalidatePath("/today");
    return { success: true, data: null };
  } catch (error) {
    console.error("Could not dismiss the morning motivation:", error);
    return { success: false, error: "Could not dismiss the message" };
  }
}
