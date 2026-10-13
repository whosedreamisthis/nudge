import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma's CLI doesn't read .env.local on its own (on Vercel the variables come from the dashboard)
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (unpooled) connection for migrations. `prisma generate` doesn't connect,
    // so it must not fail on a build machine where this isn't set.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
