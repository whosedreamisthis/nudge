# Current Feature: Seed Catalog

## Status

In Progress

## Goals

- Add `prisma/seed.ts` that seeds 7 categories (health, fitness, learning, mindfulness, productivity, sleep, social)
- Seed 10 system habits per category (70 total), each with icon, description, and default frequency / target days per week
- Give some habits a daily goal and unit (water, meditation minutes, steps)
- Make the seed idempotent (upsert by name)

## Notes

- The habit list is in `context/project-overview.md` section 6.
- Run it against the Neon dev branch only.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
- **Clerk Authentication:** ClerkProvider, sign-in/register pages in `app/(auth)/`, and `proxy.ts` redirects plus page-level `auth.protect()` for the app routes.
- **User Sync:** Clerk webhook upserts/deletes `User` rows, `getSessionUser()` maps sessions to users, and the browser timezone is captured (`app/api/webhooks/clerk/route.ts`, `lib/session.ts`, `actions/user.ts`).
