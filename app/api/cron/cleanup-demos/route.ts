import { clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/demo";
import { cleanupDemos } from "@/lib/demo-cleanup";

// Called by a scheduler (Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"). Safe to run twice.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await cleanupDemos({ db: prisma, clerk: await clerkClient(), now: new Date() });
    return Response.json(result);
  } catch (err) {
    console.error("Demo cleanup failed:", err);
    return new Response("Cleanup failed", { status: 500 });
  }
}
