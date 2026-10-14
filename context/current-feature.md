# Current Feature: Multi-Step Habits

## Status

In Progress

## Goals

- Optional daily goal in the New Habit modal: amount, unit, step size
- Today row shows a progress bar and amount (e.g. "2500/3000 ml") instead of a single check
- Tap adds one step; `…` menu has undo and "set exact amount"
- The habit counts as complete only when `amount >= dailyGoal`
- Progress can exceed the goal; the bar caps at 100%

## Notes

- Partial progress never counts toward streaks, the ring, or the weekly grid.
- Reaching 0 deletes the `HabitCompletion` row.
- Vitest tests for the increment / undo / set-amount actions.

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
- **Toggle Completion:** Tap anywhere on a habit card to complete, step up or clear it, with optimistic updates, a header completion ring, a celebration burst and a midnight refresh (`actions/habits.ts`, `components/today/`).
- **Weekly & Off-Day Habits:** Weekly habits whose goal is met move to a dimmed "Goal met this week" group, and the header ring skips unfinished weekly habits (`lib/week-goal.ts`, `components/today/TodayHabits.tsx`).
- **New Habit Modal:** "New Habit" modal on the Habits page creates custom habits with a first target (`components/habits/`, `actions/habits.ts`, `lib/habit-form.ts`).
- **Habits Catalog Page:** `/habits` lists system habits not yet added, with URL-param search and category filter, grouped by category; Add opens the prefilled modal (`components/habits/Catalog*.tsx`, `lib/catalog.ts`, `lib/db/catalog.ts`).
- **Habit Actions Menu:** Today row menu with Edit (reuses the modal, new target from this week), Archive, and Delete with confirmation for custom habits only (`components/today/HabitMenu.tsx`, `actions/habits.ts`, `lib/targets.ts`).
- **Archived Habits:** Archived tab on `/habits` with a count, Restore (also clears today's completion) and Delete for custom habits; Browse offers Restore for archived catalog habits (`components/habits/Archived*.tsx`, `lib/db/archived.ts`, `actions/habits.ts`).
