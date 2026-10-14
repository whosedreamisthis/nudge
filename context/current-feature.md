# Current Feature: Demo Try Flow

A **Try demo** button creates a temporary, isolated Clerk user with seeded sample habits. One demo per IP at a time; pressing it again from the same IP signs the visitor back into the same demo.

## Status

In Progress

## Goals

- **Try demo** button on the landing and sign-in / register pages
- Server Action `startDemo()` (`actions/demo.ts`, no API route; sets the resume cookie, signs the visitor in, redirects to `/today`):
  1. IP lookup in Redis: a hit means mint a Clerk sign-in token for that demo user and sign in (no new Clerk user)
  2. Cookie fallback: no live demo for the IP but a valid, unexpired resume cookie means sign back into that demo
  3. Otherwise claim the IP slot, create the Clerk user (generated unique email on `DEMO_EMAIL_DOMAIN`, no real credentials, `publicMetadata: demoMetadata(expiry)`)
  4. Upsert the `User` row with `isDemo` and `demoExpiresAt = now + 12h` set in both create and update (the webhook or `getSessionUser` may have made a plain row first), timezone from the browser
  5. `seedDemoUser` (from 29a), then sign in, set the resume cookie, redirect
- Banner for demo users: "Demo: your data will be deleted in X hours. Register to keep your habits", linking to `/register`; demos cannot be converted to real accounts
- One demo per IP with Upstash Redis: `SET nudge:demo:ip:<hash> <clerkId> NX EX 43200`, hash of the client IP only, race-safe (a losing racer deletes what it created and signs into the winner's demo), fail closed with "Demos are temporarily unavailable, please try again shortly" when Upstash is down (cookie resume still works)
- Resume cookie: httpOnly, secure, signed with `DEMO_COOKIE_SECRET`, holds the demo's `clerkId`, expires with the demo; an expired demo clears it
- The IP key is not deleted by the cleanup job: its TTL equals the demo's remaining lifetime, so it frees itself, and a stale slot (demo gone) is freed when `startDemo()` sees it. (The key holds only a hash of the IP, which can't be reversed from a Clerk id.)
- `startDemo()` returns a one-time sign-in ticket (a Server Action can't create a Clerk session); the Try demo button exchanges it with `signIn.ticket()` and `signIn.finalize()`
- If any creation step fails midway, delete the partial Clerk and DB data and the IP key
- Vitest tests for IP-claim handling and `startDemo()` (database, Clerk and Upstash mocked)

## Notes

- Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `DEMO_COOKIE_SECRET` are already in `.env.local`; `CRON_SECRET` is still unset.
- **Shared Redis:** the Upstash database is shared with other projects (free tier = one database). Every key starts with `nudge:` (one helper owns the prefix), only exact keys we built are touched (no `KEYS`, `SCAN`, `FLUSHDB`, `FLUSHALL`), and commands are kept few because the daily command limit is shared.
- Depends on 29a (done): `lib/demo.ts`, `lib/demo-seed.ts`, `lib/demo-cleanup.ts`, expiry check in `getSessionUser`.
- Shared IP trade-off accepted: everyone behind one IP lands in the same demo.
- Regenerate-report and habit suggestions must be disabled or rate-limited for demo users; features 20 and 22 apply this when built.
- Never use `prisma db push`; schema changes go through migrations.
- Full spec: `context/features/29b-demo-try-flow.md` (acceptance criteria included).

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
