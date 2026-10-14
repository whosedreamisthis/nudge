"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AI_OFF_COOKIE, type AiFeature, isValidTimezone, parseAiOff } from "@/lib/settings";
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

const AI_FEATURE_FIELDS = {
  weeklyReport: "aiWeeklyReport",
  motivation: "aiMotivation",
  habitSuggestions: "aiHabitSuggestions",
} as const;

// Settings: switch one AI feature (weekly report, morning motivation, habit suggestions) on or off
export async function setAiFeature(feature: AiFeature, enabled: boolean): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (!Object.hasOwn(AI_FEATURE_FIELDS, feature) || typeof enabled !== "boolean") {
    return { success: false, error: "Invalid value" };
  }

  if (user.isDemo) {
    // Nothing is stored for a demo, so the choice lives in a cookie the pages can read
    const jar = await cookies();
    const off = parseAiOff(jar.get(AI_OFF_COOKIE)?.value).filter((f) => f !== feature);
    if (!enabled) off.push(feature);
    jar.set(AI_OFF_COOKIE, off.join(","), { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
    revalidatePath("/", "layout");
    return { success: true, data: null };
  }

  await prisma.user.update({ where: { id: user.id }, data: { [AI_FEATURE_FIELDS[feature]]: enabled } });
  revalidatePath("/", "layout");
  return { success: true, data: null };
}
