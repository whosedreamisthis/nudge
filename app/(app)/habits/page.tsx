import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ArchivedList } from "@/components/habits/ArchivedList";
import { CatalogFilters } from "@/components/habits/CatalogFilters";
import { CatalogList } from "@/components/habits/CatalogList";
import { HabitsTabs } from "@/components/habits/HabitsTabs";
import { NewHabitButton } from "@/components/habits/NewHabitButton";
import { NewHabitModal } from "@/components/habits/NewHabitModal";
import { SuggestHabitButton } from "@/components/habits/SuggestHabitButton";
import { SuggestHabitWizard } from "@/components/habits/SuggestHabitWizard";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAiSettings } from "@/lib/ai-settings";
import { parseCatalogParams } from "@/lib/catalog";
import { countArchivedHabits, getArchivedHabits } from "@/lib/db/archived";
import { getCatalogHabits, getCategories } from "@/lib/db/catalog";
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

  const params = await searchParams;
  const archivedTab = params.tab === "archived";
  const filters = parseCatalogParams(params);
  // No user row yet (webhook still pending) means nothing added and nothing archived
  const user = await getSessionUser();
  const userId = user?.id ?? "";
  const suggestEnabled = user ? (await getAiSettings(user)).habitSuggestions : false;

  const [categories, archivedCount, archived, catalog] = await Promise.all([
    getCategories(),
    countArchivedHabits(userId),
    archivedTab ? getArchivedHabits(userId) : [],
    archivedTab ? [] : getCatalogHabits(userId, filters),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Habits" subtitle="Browse the catalog and manage your habits." />
        <div className="flex flex-wrap justify-end gap-2">
          {suggestEnabled && <SuggestHabitButton />}
          <NewHabitButton />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <HabitsTabs active={archivedTab ? "archived" : "browse"} archivedCount={archivedCount} />
        {archivedTab ? (
          <ArchivedList habits={archived} />
        ) : (
          <>
            <CatalogFilters categories={categories} q={filters.q} category={filters.category} />
            <CatalogList habits={catalog} filtered={Boolean(filters.q || filters.category)} />
          </>
        )}
      </div>
      <NewHabitModal categories={categories} />
      {suggestEnabled && <SuggestHabitWizard categories={categories} />}
    </>
  );
}
