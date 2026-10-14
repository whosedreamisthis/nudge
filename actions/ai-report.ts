"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  buildWeeklyPrompt,
  cooldownSecondsLeft,
  mockWeeklyReport,
  reportResponseSchema,
  reportSchema,
} from "@/lib/ai-report";
import { todayKey, toDbDate, weekStart } from "@/lib/dates";
import { getWeeklyReport, type StoredReport } from "@/lib/db/ai-report";
import { getProgressStats, getWeekGrid } from "@/lib/db/progress";
import { generateJson, isAiDisabled } from "@/lib/gemini";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

const inputSchema = z.object({ regenerate: z.boolean() });

// Returns this week's report. Without `regenerate` a stored report is reused and a new one is only
// generated when there is none; with it the stored one is overwritten, at most once per cooldown.
export async function generateWeeklyReport(input: {
  regenerate: boolean;
}): Promise<ActionResult<StoredReport>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (!user.aiEnabled) return { success: false, error: "AI features are turned off in Settings" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request" };

  const today = todayKey(user.timezone);
  const week = weekStart(today);

  try {
    const existing = await getWeeklyReport(user.id, week);
    if (existing) {
      if (!parsed.data.regenerate) return { success: true, data: existing };

      const wait = cooldownSecondsLeft(new Date(existing.generatedAt));
      if (wait > 0) {
        const minutes = Math.ceil(wait / 60);
        return {
          success: false,
          error: `You can regenerate in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`,
        };
      }
    }

    const [rows, stats] = await Promise.all([
      getWeekGrid(user.id, user.timezone, week, today),
      getProgressStats(user.id, today),
    ]);
    if (rows.length === 0) return { success: false, error: "Add a habit to get a weekly report" };

    const raw = isAiDisabled()
      ? mockWeeklyReport(rows)
      : await generateJson(buildWeeklyPrompt(rows, stats, week, today), reportResponseSchema);
    const report = reportSchema.safeParse(raw);
    if (!report.success) return { success: false, error: "Could not read the report, try again" };

    const row = await prisma.aiReport.upsert({
      where: {
        userId_type_periodStart: { userId: user.id, type: "WEEKLY", periodStart: toDbDate(week) },
      },
      create: { userId: user.id, type: "WEEKLY", periodStart: toDbDate(week), content: report.data },
      update: { content: report.data },
      select: { updatedAt: true },
    });

    revalidatePath("/progress");
    return { success: true, data: { ...report.data, generatedAt: row.updatedAt.toISOString() } };
  } catch (error) {
    console.error("Could not generate the weekly report:", error);
    return { success: false, error: "Could not generate the report, try again" };
  }
}
