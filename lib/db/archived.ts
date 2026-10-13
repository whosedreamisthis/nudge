import { prisma } from "@/lib/db";

// The user's archived habits, most recently archived first
export function getArchivedHabits(userId: string) {
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

export function countArchivedHabits(userId: string) {
  return prisma.habit.count({ where: { userId, archivedAt: { not: null } } });
}
