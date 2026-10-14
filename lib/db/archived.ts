import { cacheLife, cacheTag } from "next/cache";
import { habitsTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";

// The user's archived habits, most recently archived first
export async function getArchivedHabits(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(habitsTag(userId));

  return prisma.habit.findMany({
    where: { userId, archivedAt: { not: null } },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      color: true,
      systemHabitId: true,
      category: { select: { name: true } },
    },
    orderBy: { archivedAt: "desc" },
  });
}

export async function countArchivedHabits(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(habitsTag(userId));

  return prisma.habit.count({ where: { userId, archivedAt: { not: null } } });
}
