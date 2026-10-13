# Current Feature: Dates & Streaks Logic

## Status

In Progress

## Goals

- `lib/dates.ts`: "today" and week start (Monday) in the user's timezone
- `lib/streaks.ts`: current streak, best streak, and whether a day or week is complete
- Daily habits: day streak. Weekly habits (target 1–6): week streak counting weeks where completions >= target
- A day is complete when `amount >= dailyGoal` (default 1)
- Vitest tests for edge cases (timezone boundaries, week rollover, target changes)

## Notes

- Pure functions, no database calls.
- Past weeks use the `HabitTarget` that was in effect then.
- Used by Today, Progress and the AI report.
- Decided: weeks start on Monday. Streaks are strict (one missed day resets a daily streak; today stays open until the day ends). A grace day can be added later.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
- **Clerk Authentication:** ClerkProvider, sign-in/register pages in `app/(auth)/`, and `proxy.ts` redirects plus page-level `auth.protect()` for the app routes.
- **User Sync:** Clerk webhook upserts/deletes `User` rows, `getSessionUser()` maps sessions to users, and the browser timezone is captured (`app/api/webhooks/clerk/route.ts`, `lib/session.ts`, `actions/user.ts`).
- **Seed Catalog:** Idempotent seed of 7 categories and 70 system habits, some with daily goals, run via `npm run db:seed` (`prisma/seed.ts`, `prisma/seed-data.ts`).
- **App Shell & Navigation:** `app/(app)/` layout with a bottom tab bar on phones, a left sidebar from `md` up, `PageHeader`, and placeholder pages (`components/shared/`).
- **Palette & Dark Mode:** Sky blue / cloud white / forest green / midnight theme in light and dark (follows the OS, switch comes with Settings), checked by `lib/theme.test.ts` (`app/globals.css`, `components/shared/ThemeProvider.tsx`).
