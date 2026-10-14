# Current Feature: Today Declutter

Move the stats off the Today page: remove the two stat tiles from Today and show the same numbers on the Progress page.

## Status

In Progress

## Goals

- Remove the two stat tiles (Active streaks, Best streak) from the Today page, so the habits come straight after the header
- On the Progress page, replace the **Today** tile (done/total) with a **Best streak** tile
- On the Progress page, replace the **Average streak** tile with an **Active streaks** tile
- The Progress tiles become: Best streak, Active streaks, Weekly average, Top habit
- Today keeps the completion ring in its header; the consistency heatmap stays in its `aside` slot (below the habits on phones, beside them from `xl`)
- No new Today header line for active streaks (the Progress tile covers it)

## Notes

- Today renders the tiles in `components/today/TodayHabits.tsx` (the `<StatTiles stats={stats} />` block and its `xl:` grid placement). Remove it and let the habit list and the aside take the layout it freed up; check the `xl` grid still reads well (list on the left, heatmap on the right).
- `components/today/StatTiles.tsx` exports `Tile` and `HabitChip`, which `components/progress/ProgressTiles.tsx` also uses. Move them to a shared file (for example `components/shared/StatTile.tsx`) and delete the unused `StatTiles` component.
- The numbers already exist: `getTodayStats` in `lib/stats.ts` returns `activeStreaks` and `bestStreak` (`{ name, icon, unit, best }`), and `getToday` in `lib/db/today.ts` builds them from each habit's streak history. Compute them for the Progress page too (`lib/db/progress.ts` and `app/(app)/progress/page.tsx`), reusing `getTodayStats` rather than duplicating the streak logic. Then `getToday` no longer needs to return `stats`.
- `ProgressTiles` currently takes `today`, `averageStreakDays`, `weeklyAverage`, `topHabit`. Replace `today` and `averageStreakDays` with `activeStreaks` and `bestStreak`. Remove anything that only existed for the old tiles (for example the average streak calculation) if nothing else uses it.
- Keep each tile's existing look: Best streak uses the amber tint and trophy icon, Active streaks the orange tint and flame icon (as on Today now).
- Update tests: `lib/stats.test.ts`, `lib/db/today.test.ts`, `lib/db/progress.test.ts`, `lib/progress.test.ts` (whatever covered the removed pieces), and any component tests.
- The demo seed (`lib/demo-seed.ts`) is unaffected. The empty and sample states of the Today page (`getSampleToday` in `lib/sample-habits.ts`) may also pass `stats`; remove it there too.
- Do the build and check both pages at phone width and at `xl`: the Today page should show the first habit without scrolling on a phone.

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
- **Demo Data and Expiry:** Demo seed (5 habits, 14 weeks of completions, journal entries), expired demos blocked in `getSessionUser`, and a CRON_SECRET-protected cleanup job (`lib/demo.ts`, `lib/demo-seed.ts`, `lib/demo-cleanup.ts`, `app/api/cron/cleanup-demos/`).
- **Demo Try Flow:** Try demo button on the landing and auth pages; one demo per IP via Upstash, signed resume cookie, banner and a daily cap (`actions/demo.ts`, `lib/demo-redis.ts`, `components/demo/`).
