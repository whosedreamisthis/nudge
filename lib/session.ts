import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { isDemoExpired } from "@/lib/demo";

// Maps the signed-in Clerk user to our User row. Creates it if the webhook
// hasn't arrived yet (a read first, since the row nearly always exists). Every user-scoped
// query should filter by the returned id.
// An expired demo gets no user at all, so every page and action is blocked even when the cleanup
// job hasn't run yet; its Clerk session is revoked so the next visit is signed out.
export const getSessionUser = cache(async () => {
  const { userId, sessionId } = await auth();
  if (!userId) return null;

  const user =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ??
    (await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId },
    }));

  if (isDemoExpired(user, new Date())) {
    if (sessionId) {
      try {
        await (await clerkClient()).sessions.revokeSession(sessionId);
      } catch (error) {
        // Still blocked below; the cleanup job removes the Clerk user later
        console.error("Could not revoke the expired demo session:", error);
      }
    }
    return null;
  }

  return user;
});
