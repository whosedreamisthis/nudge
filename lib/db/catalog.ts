import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG, habitsTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import type { CatalogFilters } from "@/lib/catalog";

// System habits the user hasn't added (an archived habit doesn't count as added), filtered by the URL params
export async function getCatalogHabits(userId: string, { q, category }: CatalogFilters) {
  "use cache";
  cacheLife("hours");
  // The list is the shared catalog minus what this user has added
  cacheTag(CATALOG_TAG, habitsTag(userId));

  return prisma.systemHabit.findMany({
    where: {
      habits: { none: { userId, archivedAt: null } },
      ...(category && { category: { name: category } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      categoryId: true,
      defaultFrequency: true,
      defaultTargetDaysPerWeek: true,
      defaultDailyGoal: true,
      defaultUnit: true,
      defaultStepSize: true,
      category: { select: { name: true } },
      // An archived copy: Browse offers to restore it instead of adding a duplicate
      habits: { where: { userId, archivedAt: { not: null } }, select: { id: true }, take: 1 },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
}

// Category names for the habit forms; shared by everyone, changes only with the seed
export async function getCategories() {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  return prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
