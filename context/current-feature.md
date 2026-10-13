# Current Feature: Toggle Completion

## Status

In Progress

## Goals

- Tapping a habit toggles it complete / incomplete for today
- Completed rows: pale yellow background and filled orange check; incomplete: white with an outlined check
- Optimistic UI update, then a Server Action
- Circular completion ring with "x of y complete" in the Today header

## Notes

- Server Action validates with Zod, scopes by `userId`, and returns `{ success, data, error }`.
- Creates or deletes the `HabitCompletion` for the user's local today.
- Vitest tests for the action.
- The spec's yellow/orange colours predate the palette change: use the existing completion tokens (`complete`, `complete-tint`) instead.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
- **Clerk Authentication:** ClerkProvider, sign-in/register pages in `app/(auth)/`, and `proxy.ts` redirects plus page-level `auth.protect()` for the app routes.
- **User Sync:** Clerk webhook upserts/deletes `User` rows, `getSessionUser()` maps sessions to users, and the browser timezone is captured (`app/api/webhooks/clerk/route.ts`, `lib/session.ts`, `actions/user.ts`).
- **Seed Catalog:** Idempotent seed of 7 categories and 70 system habits, some with daily goals, run via `npm run db:seed` (`prisma/seed.ts`, `prisma/seed-data.ts`).
- **App Shell & Navigation:** `app/(app)/` layout with a bottom tab bar on phones, a left sidebar from `md` up, `PageHeader`, and placeholder pages (`components/shared/`).
- **Palette & Dark Mode:** Sky blue / cloud white / forest green / midnight theme in light and dark (follows the OS, switch comes with Settings), checked by `lib/theme.test.ts` (`app/globals.css`, `components/shared/ThemeProvider.tsx`).
- **Dates & Streaks Logic:** Pure Monday-week date helpers and strict day/week streaks with per-week target history (`lib/dates.ts`, `lib/streaks.ts`).
- **Today Page: Habit List:** `/today` greeting, habit rows with streaks, complete and in-progress looks, hover actions menu and empty state (`app/(app)/today/`, `components/today/`, `lib/db/today.ts`).
- **Today Stat Tiles:** Active-streaks and best-streak tiles (with the best habit's icon) above the list, plus fill-style habit cards (`components/today/StatTiles.tsx`, `lib/stats.ts`, `lib/db/today.ts`).
