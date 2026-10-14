"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isValidTimezone } from "@/lib/settings";
import type { ActionResult } from "@/types/actions";

// Stores the browser timezone once; later calls leave a captured timezone alone.
export async function captureTimezone(timezone: string) {
  const user = await getSessionUser();
  if (!user || user.timezone !== "UTC" || timezone === "UTC") return;
  if (!isValidTimezone(timezone)) return;

  await prisma.user.update({ where: { id: user.id }, data: { timezone } });
}

// Settings: change the timezone. Completions are stored as dates and stay as they are; "today"
// and the week boundaries move, so every page is refreshed.
export async function updateTimezone(timezone: string): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (user.isDemo) return { success: false, error: "The demo timezone can't be changed" };
  if (!z.string().min(1).safeParse(timezone).success || !isValidTimezone(timezone)) {
    return { success: false, error: "That isn't a valid timezone" };
  }

  await prisma.user.update({ where: { id: user.id }, data: { timezone } });
  revalidatePath("/", "layout");
  return { success: true, data: null };
}

// Settings: switch the AI features (weekly report, morning motivation, habit suggestions) on or off
export async function setAiEnabled(enabled: boolean): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (user.isDemo) return { success: false, error: "Not available in the demo" };
  if (typeof enabled !== "boolean") return { success: false, error: "Invalid value" };

  await prisma.user.update({ where: { id: user.id }, data: { aiEnabled: enabled } });
  revalidatePath("/", "layout");
  return { success: true, data: null };
}
