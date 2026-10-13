import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// Maps the signed-in Clerk user to our User row. Creates it if the webhook
// hasn't arrived yet. Every user-scoped query should filter by the returned id.
export const getSessionUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  });
});
