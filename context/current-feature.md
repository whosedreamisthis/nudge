# Current Feature: Demo Data and Expiry

Backend half of the demo account: mark, seed, expire and delete demo users. The Try demo button and per-IP lock come in `29b-demo-try-flow.md`.

## Status

In Progress

## Goals

- Migration: `User.isDemo Boolean @default(false)` and `User.demoExpiresAt DateTime?` with an index
- Demo Clerk users carry `publicMetadata: { isDemo: true, demoExpiresAt }` (helper in `lib/demo.ts`), so the cleanup job can find them
- `lib/demo-seed.ts`: `seedDemoUser(userId, timezone)` creates 5 habits (daily, multi-step water goal, weekly 3 days/week), about 14 weeks of completions with realistic gaps, and a few journal entries
- Request-time expiry: a demo whose `demoExpiresAt` has passed is signed out and blocked even if cleanup hasn't run
- Cleanup job `GET /api/cron/cleanup-demos` (protected by `CRON_SECRET`): delete expired demos (Clerk user first, then the DB user, in batches), orphan sweep of Clerk demo users with no DB row, idempotent, retries failed Clerk deletes
- Clerk webhook: `user.created` is safe for demo users, and `user.deleted` is a no-op if the DB user is already gone
- Demo users see only theme and sign-out in Settings (see `27-settings-modal.md`)
- Vitest tests for seeding, expiry and cleanup (database and Clerk mocked)

## Notes

- Env var: `CRON_SECRET`. Upstash and `DEMO_COOKIE_SECRET` come with 29b.
- The pre-generated `AiReport` row is added by `20-ai-weekly-report` (it owns that model); later features that add user-created data extend `lib/demo-seed.ts` and its test.
- 29b extends the cleanup job to delete the expired demo's IP key.
- Vercel Hobby limits cron to once a day; use an external scheduler or accept lag, relying on request-time expiry.
- Open question: do demo users count toward Clerk user limits on the current plan?
- To try it without the button, create a demo user by hand (or a test helper) and run the job.
- Never use `prisma db push`; schema changes go through migrations.
- Full spec: `context/features/29a-demo-data-and-cleanup.md` (acceptance criteria included).

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
- **Multi-Step Habits:** Optional daily goal, unit and amount per tap in the New Habit and Edit forms, plus Undo and Set amount in the Today menu (`actions/habits.ts`, `lib/habit-form.ts`, `components/today/SetAmountDialog.tsx`).
- **Consistency Heatmap:** Today card showing the last 14 weeks of completed habits per day as dots on a five-step grey-to-orange scale, with legend and total (`components/today/ConsistencyCard.tsx`, `lib/consistency.ts`, `lib/db/consistency.ts`).
- **Progress Weekly Grid:** `/progress` with four summary tiles and a habits-by-days weekly grid with previous/next week arrows (`app/(app)/progress/`, `components/progress/`, `lib/week-grid.ts`, `lib/db/progress.ts`).
- **Progress Insights Tab:** `/progress` shows this-week-vs-last-week bars (with a 30-day summary line) and habit performance bars under the grid (`components/progress/`, `lib/insights.ts`, `lib/db/insights.ts`).
- **Settings Modal:** Gear in the Navbar opens Settings: account, Light/Dark theme, timezone, AI switch, reminders placeholder and delete account (`components/shared/SettingsButton.tsx`, `actions/user.ts`, `lib/settings.ts`).
- **Journal Write Entry:** `/journal` page to write today's entry with an optional mood, Courier Prime text and debounced autosave (`actions/journal.ts`, `components/journal/`, `lib/journal.ts`).
- **Journal History:** History tab grouped by month with search and month/mood filters, entry page to read or edit, and delete with confirmation (`app/(app)/journal/`, `components/journal/`, `lib/db/journal.ts`).
- **Journal Multiple Entries:** Any number of journal entries per day, each with its own mood and clock time; Today lists them with a New entry button, History and the entry page work by id (`actions/journal.ts`, `components/journal/TodayEntries.tsx`, `app/(app)/journal/[id]/`).
- **Focus Timer:** `/focus` countdown with presets, custom minutes, pause/resume/stop, stored in localStorage, with a chime and toast on finish (`components/focus/`, `lib/focus.ts`, `lib/focus-store.ts`).
- **Focus: Link to a Habit:** Start a Focus session from `/focus?habit=<id>` or the Today menu; on finish a checkbox counts it for the habit (`actions/habits.ts`, `lib/focus.ts`, `components/focus/`).
