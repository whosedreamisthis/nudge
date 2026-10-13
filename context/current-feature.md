# Current Feature: Today Page: Habit List

## Status

In Progress

## Goals

- `/today` greeting with the current date
- List the user's active habits as rows: icon, name, category tag, description, current streak
- Empty state with a link to the Habits page
- Read-only: no completion toggling yet

## Notes

- Server component; data via a query in `lib/db/`, scoped by `userId`.
- Streak display: "13d" for daily, "12w" for weekly.
- Pale yellow row background and a check button come with the toggle feature (the completed look now uses the green completion colour from the theme).
- Build order (agreed with the user): UI first with realistic sample data typed like the database models, so streaks and states can be seen in the browser; then replace the sample data with the real query.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
- **Clerk Authentication:** ClerkProvider, sign-in/register pages in `app/(auth)/`, and `proxy.ts` redirects plus page-level `auth.protect()` for the app routes.
- **User Sync:** Clerk webhook upserts/deletes `User` rows, `getSessionUser()` maps sessions to users, and the browser timezone is captured (`app/api/webhooks/clerk/route.ts`, `lib/session.ts`, `actions/user.ts`).
- **Seed Catalog:** Idempotent seed of 7 categories and 70 system habits, some with daily goals, run via `npm run db:seed` (`prisma/seed.ts`, `prisma/seed-data.ts`).
- **App Shell & Navigation:** `app/(app)/` layout with a bottom tab bar on phones, a left sidebar from `md` up, `PageHeader`, and placeholder pages (`components/shared/`).
- **Palette & Dark Mode:** Sky blue / cloud white / forest green / midnight theme in light and dark (follows the OS, switch comes with Settings), checked by `lib/theme.test.ts` (`app/globals.css`, `components/shared/ThemeProvider.tsx`).
- **Dates & Streaks Logic:** Pure Monday-week date helpers and strict day/week streaks with per-week target history (`lib/dates.ts`, `lib/streaks.ts`).
