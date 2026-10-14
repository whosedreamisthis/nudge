import { prisma } from "@/lib/db";

// The habit a Focus session is linked to, if it is the user's own and still active
export async function getFocusHabit(userId: string, habitId: string) {
  return prisma.habit.findFirst({
    where: { id: habitId, userId, archivedAt: null },
    select: { id: true, name: true },
  });
}
