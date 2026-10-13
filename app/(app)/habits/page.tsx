import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CatalogFilters } from "@/components/habits/CatalogFilters";
import { CatalogList } from "@/components/habits/CatalogList";
import { NewHabitButton } from "@/components/habits/NewHabitButton";
import { NewHabitModal } from "@/components/habits/NewHabitModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { parseCatalogParams } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getCatalogHabits } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/session";

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // The catalog comes from the database per request, so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const filters = parseCatalogParams(await searchParams);
  const user = await getSessionUser();

  const [categories, habits] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    // No user row yet (webhook still pending) means nothing added, so show the whole catalog
    getCatalogHabits(user?.id ?? "", filters),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Habits" subtitle="Browse the catalog and add habits." />
        <NewHabitButton />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <CatalogFilters categories={categories} q={filters.q} category={filters.category} />
        <CatalogList habits={habits} filtered={Boolean(filters.q || filters.category)} />
      </div>
      <NewHabitModal categories={categories} />
    </>
  );
}
