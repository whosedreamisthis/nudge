import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { NewHabitButton } from "@/components/habits/NewHabitButton";
import { NewHabitModal } from "@/components/habits/NewHabitModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { prisma } from "@/lib/db";

export default async function HabitsPage() {
  // The categories come from the database per request, so stop prerendering first
  await connection();

  // Real access check; the proxy redirect is only an optimization
  await auth.protect();

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Habits" subtitle="Browse and add habits here." />
        <NewHabitButton />
      </div>
      <NewHabitModal categories={categories} />
    </>
  );
}
