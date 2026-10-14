import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseDemoMetadata } from "@/lib/demo";

// Clerk retries on non-2xx, so every branch below is safe to run twice.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated":
      // Nothing from Clerk is stored besides the id, so an upsert covers both. A demo user is marked
      // from its metadata, so a row created here before startDemo() writes it is still a demo.
      {
        const demo = parseDemoMetadata(evt.data.public_metadata);
        await prisma.user.upsert({
          where: { clerkId: evt.data.id },
          update: {},
          create: {
            clerkId: evt.data.id,
            ...(demo.isDemo && { isDemo: true, demoExpiresAt: demo.demoExpiresAt }),
          },
        });
      }
      break;

    case "user.deleted":
      if (evt.data.id) {
        // deleteMany doesn't throw when the row is already gone; habits and completions cascade
        await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
      }
      break;
  }

  return new Response("OK", { status: 200 });
}
