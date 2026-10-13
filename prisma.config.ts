import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma's CLI doesn't read .env.local on its own
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (unpooled) connection for migrations
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
