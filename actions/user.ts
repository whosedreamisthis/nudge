"use server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Stores the browser timezone once; later calls leave a captured timezone alone.
export async function captureTimezone(timezone: string) {
  const user = await getSessionUser();
  if (!user || user.timezone !== "UTC" || timezone === "UTC") return;
  if (!isValidTimezone(timezone)) return;

  await prisma.user.update({ where: { id: user.id }, data: { timezone } });
}
