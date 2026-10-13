import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { seedCategories } from "./seed-data";

// Seeds the built-in catalog. Safe to re-run: everything is upserted by name.
config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  console.log(`Seeding ${new URL(connectionString!).hostname}`);

  for (const { name, icon, habits } of seedCategories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { icon },
      create: { name, icon },
    });

    for (const habit of habits) {
      await prisma.systemHabit.upsert({
        where: { categoryId_name: { categoryId: category.id, name: habit.name } },
        update: habit,
        create: { ...habit, categoryId: category.id },
      });
    }
  }

  const [categories, systemHabits] = await Promise.all([
    prisma.category.count(),
    prisma.systemHabit.count(),
  ]);
  console.log(`Done: ${categories} categories, ${systemHabits} system habits`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
