# Nudge — Project Overview

A habit tracker that helps you build daily routines, see your streaks, and get AI-generated feedback on how you're doing.

---

## Table of Contents

1. [Problem](#1-problem)
2. [Target Users](#2-target-users)
3. [Features](#3-features)
4. [Tech Stack](#4-tech-stack)
5. [Architecture](#5-architecture)
6. [Data Model](#6-data-model)
7. [Routes](#7-routes)
8. [UI / UX](#8-ui--ux)
9. [Development Rules](#9-development-rules)
10. [Open Questions](#10-open-questions)
11. [Reference Links](#11-reference-links)

---

## 1. Problem

Most habit trackers either show a checklist and nothing else, or bury the useful part (what to do differently) under charts. Nudge keeps daily check-in to a single tap and adds the missing layer: streaks, a consistency heatmap, and a plain-language AI report that says what slipped and what to do next.

---

## 2. Target Users

- People building a handful (3–10) of daily habits across health, fitness, learning, and mindfulness.
- Users who want fast mobile-friendly check-in and light motivation, not a heavy productivity system.
- Users who don't want to start from a blank slate: they can pick from ready-made habits or create their own.

---

## 3. Features

### 3.1 Today (page 1)

- Greeting with the current date ("Hey Friend 👋").
- **Morning Motivation** card: short AI-written message based on recent habit history. Dismissable.
- **Stat tiles:** total habits, active streaks, best streak, completions this week.
- **Today's habits** list with a circular completion percentage (e.g. 80%, "4 of 5 complete"). Weekly habits (e.g. 3 days/week) appear every day so they can be checked on whichever days the user does them.
- **Off-day habits:** a weekly habit whose target is already met this week moves to a quieter "Rest day / goal met" group below the main list (e.g. "Strength training · 3/3 this week"). It is dimmed but still tappable, so the user can log a bonus day. Off-day habits are **not counted** in the daily ring or "x of y complete".
- **Multi-step habits (daily goal):** a habit can have a daily goal such as 2000 ml, 8 glasses, or 35 min. Its row shows a **progress bar** with the amount (e.g. "2500/3000 ml") instead of a single check.
  - Tapping adds one step (the habit's step size, e.g. 250 ml); an undo option and a "set exact amount" option live in the row's `…` menu.
  - The habit shows as **complete only when the goal is reached**; partial progress never counts toward the streak, the daily ring, or the weekly grid.
  - Habits without a daily goal keep the simple tap-to-toggle behaviour.
- Each habit row: emoji icon, name, category tag, description, current streak (flame), overflow menu (`…`), and a check button.
- **Tapping a habit toggles it complete / incomplete** for today.
- **Consistency heatmap:** completions per day over the last 14 weeks, with a Less → More colour scale.

### 3.2 Progress & Insights (page 2)

Design principle: **keep it concise.** The app should answer "how am I doing?" at a glance; users shouldn't get lost in reports. Two tabs only: **Weekly** and **Insights**.

**Weekly tab**

- **AI Weekly Report:** narrative summary of the week (Mon–Sun) plus 3 actionable insights. Has a "Regenerate report" button and a generated-at timestamp.
- **Summary tiles:** today's progress, average streak, best streak (all-time), top habit.
- **Weekly grid:** habits × days (Mon–Sun), each habit with its own colour, completed days filled in. Previous / next arrows next to the date range let the user browse earlier weeks (the next arrow is disabled on the current week). For weekly habits, any day can be checked; the week counts as met once the target number of days is reached, and unchecked days are not misses.

**Insights tab** (deliberately small)

- **Two tiles:** total completions (all-time) and weekly average (last 7 days).
- **This week vs last week:** one bar chart, completions per day.
- **Habit performance:** one progress bar per habit for the week (e.g. 2/7 · 29%, 1/3 · 33%), measured against the habit's own target and capped at 100%.

**Deliberately left out** (seen in reference mockups, but too much for a simple app): the separate Statistics tab, completion-by-day chart, rolling 7-day and 30-day charts, completions-by-category donut, top habits (30d), all-habits stat list, active-streaks card (streaks already show on Today), and the longest-ever / needs-attention cards. Any of these can be added later if users ask for them.

### 3.3 Habits (page 3)

The Habits page is a **catalog to browse and add from**, not a list of the user's active habits (those are already on Today).

- **Search** by text (name and description) and **filter by category**; both can be combined.
- Two tabs: **Browse** (system habits the user hasn't added yet) and **Archived** (the user's archived habits, with a Restore button).
- Each catalog row: icon, name, category and frequency tags, description, and an **Add** button that opens the New Habit modal prefilled (the user can adjust frequency, icon and colour before saving). Habits already added don't appear in Browse.
- **New Habit** button to create a custom habit.
- **Suggest a habit** button, which opens the AI Habit Suggestions modal (see 3.5).
- **Managing active habits** happens from the `…` menu on each habit row on Today:
  - **Edit** and **Archive**: available on every habit. Archived habits leave Today, keep their history, and can be restored from the Archived tab.
  - **Delete** (permanent, with a confirmation dialog): **custom habits only**. Habits added from the system catalog can be archived but not deleted, so the delete option is hidden for them.
- **Seeded catalog:** 7 categories × 10 system habits = **70 habits** (see [6. Data Model](#6-data-model)).
- **Frequency per habit:** **Daily** or **Weekly**, with a **Target Days per Week** selector (1–7). Choosing 7 means a daily habit ("Daily habit selected" hint). The frequency tag on the row shows `daily` or e.g. `3x/week`.

### 3.4 New Habit modal

Opened from "New Habit" (and when adding a system habit, prefilled). Fields:

- **Habit Name** (placeholder "E.g. Drink 2L of water") and **Description** ("Why does this habit matter to you?")
- **Category** dropdown
- **Frequency** dropdown (Daily / Weekly) and **Target Days per Week** segmented 1–7
- **Daily goal** (optional): amount, unit (e.g. ml, glasses, min, pages) and step size. Leave empty for a simple done / not done habit.
- **Icon** picker (emoji set: strength, run, books, meditation, water, sleep, salad, journal, target, brain, pill, walk)
- **Color** picker (9 colours)
- **Cancel** / **Create habit**

### 3.5 AI Habit Suggestions modal

Opened from "Suggest a habit". A short 3-step wizard: "Answer 3 quick questions and I'll suggest 3 personalized habits."

- Step 1 (designed): **"What are your goals right now?"**, a free-text box (placeholder "e.g. get fitter, read more, reduce phone time...") with **Cancel** / **Next**.
- Steps 2 and 3: questions not designed yet. Likely candidates: how much time the user has per day, and what they've struggled with before.
- Result: **3 suggested habits**, each with name, description, category, icon and frequency, generated by the Gemini API from the answers plus the user's existing habits (so it doesn't suggest duplicates). The user can add any of them, which opens the New Habit modal prefilled.
- Next is disabled until the field has text. Answers are used for this one request and not stored.

### 3.6 Journal

A simple space for daily reflection. No mockup yet; proposed scope, kept minimal:

- One entry per day (editable that day and afterwards), plain text with an optional mood.
- **Journal history:** every entry is kept and browsable. Past entries are listed newest first, grouped by month, with a date, mood and a short preview. Tapping one opens the full entry to read or edit. Search by text, and filter by month or mood. Entries are never auto-deleted; deleting one is manual and asks for confirmation.
- Optional prompt of the day (e.g. "Write 3 things you're grateful for") that can be generated by AI or picked from a short built-in list.
- Entry text (writing, previews and full view of past entries) is set in **Courier Prime**, a typewriter-style font; the rest of the app keeps its normal UI font. Load it with `next/font/google`.
- Private to the user; never sent to the AI unless the user opts in (e.g. to include journal themes in the weekly report).

### 3.7 Focus

A timer for sessions of focused time. No mockup yet; proposed scope:

- **Start a session:** choose a duration (presets such as 5 / 10 / 20 / 30 min, or custom) and optionally **link it to a habit** ("Meditate", "Read 20 minutes", or any other habit), or pick **Meditation** as a free session.
- Countdown with pause, resume and stop; a soft sound or notification at the end.
- **Completing a linked session marks that habit complete for today** (the same toggle as tapping it on Today). Stopping early does not.
- The timer keeps running if the user switches tabs (based on a stored end timestamp, not a ticking counter).
- Finished sessions are logged (date, duration, linked habit) and feed a simple "focus minutes this week" number on Progress.

### 3.8 Settings modal

Not designed yet. Candidates: profile, theme, notification/reminder preferences, data export, delete account.

---

## 4. Tech Stack

| Layer        | Choice                              | Notes                                                       |
| ------------ | ----------------------------------- | ----------------------------------------------------------- |
| Framework    | **Next.js 16** + **React 19**       | App Router, server components with client islands           |
| Language     | **TypeScript**                      | End-to-end type safety                                      |
| Backend      | Next.js Server Actions / API routes | Habit CRUD, toggling completions, AI report generation      |
| Database     | **Neon** (serverless PostgreSQL)    | Branching for dev/preview                                   |
| ORM          | **Prisma 7**                        | Uses `prisma.config.ts` + Neon driver adapter               |
| Auth         | **Clerk**                           | Users synced to DB by `clerkId`                             |
| Demo IP lock | **Upstash Redis**                   | `SET NX EX 12h` maps a hashed IP to its demo; one live demo per IP |
| AI           | **Gemini API**                      | Weekly report, morning motivation, habit suggestions        |
| Client state | **Zustand**                         | Shared client state (modals, filters); preferred over Context |
| Styling      | **Tailwind CSS v4** + **shadcn/ui** | Lucide icons                                                |
| Testing      | **Vitest**                          | Unit tests for server actions and utilities                 |

### Prisma 7 setup notes

- The connection URL **does not go in `schema.prisma`**; it lives in `prisma.config.ts`.
- Generator is `prisma-client` with an explicit `output` path; import from the generated path, not `@prisma/client`.
- A **driver adapter is required** — for Neon, `@prisma/adapter-neon`.
- Keep `prisma` and `@prisma/client` on the same 7.x version (7.10.0 installed). npm's `latest` tag for `prisma` currently points at an 8.0 release candidate, so install with `npm install -D prisma@7.10.0`.
- Two env vars: a **pooled** URL for the app and a **direct (unpooled)** URL for CLI/migrations.

### Environment variables

Local values live in **`.env.local`** (not `.env`), which Next.js loads automatically and git ignores. Do not create a `.env` file. The Prisma CLI does not read `.env.local` on its own, so `prisma.config.ts` must load it explicitly (e.g. `dotenv` with `path: ".env.local"`). Production values are set in the hosting dashboard.

```bash
# Database (Neon)
DATABASE_URL=              # pooled — used by the app
DATABASE_URL_UNPOOLED=     # direct — used by Prisma CLI / migrations

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/today
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/today
CLERK_WEBHOOK_SIGNING_SECRET=   # user.created / user.updated / user.deleted sync

# AI
GEMINI_API_KEY=

# Demo (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
DEMO_COOKIE_SECRET=         # signs the demo resume cookie
CRON_SECRET=                # protects the demo cleanup job
```

---

## 5. Architecture

- Server components load the day's habits, completions, and stats; client components handle the check toggle (optimistic update, then server action).
- All writes go through Server Actions, validated with Zod and scoped to the signed-in user.
- Streaks and stats are **derived from completion rows** at read time (or cached per habit if it gets slow) rather than stored as editable counters.
- **Frequency-aware calculations:** a daily habit (target 7) has a **day streak** (consecutive days completed, shown as "13d"). A weekly habit (target 1–6) has a **week streak** (consecutive weeks where completions >= target, shown as "12w"). Weekly-habit rates use "weeks met" rather than "days missed". One shared helper module (`lib/streaks.ts`) serves the Today list, weekly grid, stats, and the AI report.
- Changing a habit's target applies **from the current week forward**; past weeks are evaluated against the target in effect then (see `HabitTarget` below).
- AI content (weekly report, morning motivation) is generated server-side, stored, and reused: one weekly report per user per week, one motivation per user per day. "Regenerate" overwrites the stored report.
- "Today" is evaluated in the **user's timezone**, stored on the user.

---

### Authentication (Clerk)

- **Sign-in / sign-up:** Clerk's prebuilt components on `/sign-in` and `/register`, living in the `app/(auth)/` route group. Email plus Google social login are suggested for launch (to be confirmed in the Clerk dashboard).
- **Provider:** the root layout wraps the app in `<ClerkProvider>` from `@clerk/nextjs`.
- **Route protection:** `clerkMiddleware()` in `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`; confirm against `node_modules/next/dist/docs/`). `/today`, `/habits`, `/progress`, `/journal` and `/focus` call `auth.protect()`; `/sign-in`, `/register` and `/api/webhooks/*` stay public. Signed-in users hitting `/sign-in` are redirected to `/today`.
- **Server-side identity:** server components and Server Actions read the user with `auth()` (`const { userId } = await auth()`). A single `getSessionUser()` helper in `lib/session.ts` turns the Clerk `userId` into our `User` row so every query is scoped to it. Never accept a user ID from the client.
- **User sync:** a Clerk webhook at `/api/webhooks/clerk` verifies the request with `verifyWebhook()` from `@clerk/nextjs/webhooks`, then upserts the `User` row on `user.created` / `user.updated` and deletes it, with all of that user's data, on `user.deleted`. It returns 400 on a bad signature, and any non-2xx makes Clerk retry, so the handler must be idempotent. `getSessionUser()` also creates the row on first request if the webhook hasn't arrived yet.
- **Timezone:** captured from the browser on first sign-in and stored on `User.timezone` (editable in Settings).
- **Account management:** profile, email and sign-out use Clerk's `<UserButton />` / `<UserProfile />`, so the Settings modal doesn't need its own password or email forms. Deleting an account goes through Clerk, and the webhook cleans up our data.
- **Demo account:** a "Try demo" button creates a temporary Clerk user with seeded sample habits, one per IP, deleted from Clerk and the database after 12 hours. Uses Upstash Redis for the IP lock. See `context/features/demo-spec.md`. Otherwise the app is for signed-in users only.

---

## 6. Data Model

| Model             | Key fields                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `User`            | `id`, `clerkId`, `timezone`, `isDemo`, `demoExpiresAt?`, `createdAt`                                                                            |
| `Category`        | `id`, `name`, `icon` — 7 seeded categories (listed below)                                                           |
| `SystemHabit`     | `id`, `name`, `description`, `icon`, `categoryId`, `defaultFrequency`, `defaultTargetDaysPerWeek` — the built-in catalog |
| `Habit`           | `id`, `userId`, `systemHabitId?`, `name`, `description`, `icon`, `color`, `categoryId`, `dailyGoal?`, `unit?`, `stepSize?`, `archivedAt?`, `createdAt` |
| `HabitTarget`     | `id`, `habitId`, `frequency` (daily / weekly), `targetDaysPerWeek` (1–7; 7 = daily), `effectiveFrom` (user-local week start) — newest row with `effectiveFrom <=` the week applies |
| `HabitCompletion` | `id`, `habitId`, `userId`, `date` (user-local day), `amount` (default 1), unique on (`habitId`, `date`). A day counts as complete when `amount >= habit.dailyGoal` (goal defaults to 1) |
| `AiReport`        | `id`, `userId`, `type` (weekly / motivation), `periodStart`, `content`, `generatedAt`                               |
| `JournalEntry`    | `id`, `userId`, `date` (user-local day), `content`, `mood?`, `createdAt`, `updatedAt`, unique on (`userId`, `date`) |
| `FocusSession`    | `id`, `userId`, `habitId?`, `kind` (habit / meditation), `plannedSeconds`, `startedAt`, `endedAt?`, `status` (running / paused / completed / stopped) |

Notes:

- Adding a system habit **copies** it into the user's `Habit` rows (with `systemHabitId` for reference), so users can edit it freely.
- Toggling a simple habit creates or deletes the `HabitCompletion` for that day; tapping a multi-step habit increases `amount` by `stepSize` (undo decreases it, and a row at 0 is deleted).
- Streaks, the weekly grid and stats only count days where the goal was reached.
- **Seed data** (`prisma/seed.ts`, idempotent: upsert by name): 7 categories, 10 system habits each.

| Category        | Seeded habits                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **health**      | Drink 2L of water, Take vitamins, Eat a serving of vegetables, No sugary drinks, Eat breakfast, Stretch, Floss, Take a walk after meals, Limit alcohol, Cook a healthy meal |
| **fitness**     | Morning run, Strength training, 10,000 steps, Yoga, Cycle, Swim, Do 20 push-ups, Plank for 1 minute, Take the stairs, Play a sport              |
| **learning**    | Read 20 minutes, Learn a new word, Practice a language, Listen to a podcast, Online course lesson, Practice an instrument, Watch an educational video, Study for 30 minutes, Write a summary of what I learned, Practice coding |
| **mindfulness** | Meditate, Journal, Gratitude list, Deep breathing, Digital detox hour, Mindful walk, Body scan, Positive affirmation, Screen-free meal, Reflect on the day |
| **productivity**| Plan tomorrow, Top 3 priorities, Inbox zero, Deep work block, Tidy workspace, Review weekly goals, No social media before noon, Do the hardest task first, Time-block the day, Clear one to-do |
| **sleep**       | Sleep 8 hours, In bed by 10:30 pm, Wake up at the same time, Wind-down routine, No caffeine after 2 pm, No screens before bed, Cool dark bedroom, Read before bed, Evening stretch, Morning sunlight |
| **social**      | Call a friend or family, Send a kind message, Quality time with loved ones, Do a random act of kindness, Reach out to someone new, Plan a get-together, Give a compliment, Write a thank-you note, Volunteer, Put the phone away at dinner |

- A habit is **custom** when `systemHabitId` is null, and **system-based** otherwise.
- Archiving sets `archivedAt` (restoring clears it). Archived habits disappear from Today and stats but keep their completions.
- Permanent delete removes the habit and its completions. The server action must reject it when `systemHabitId` is set, not just hide the button in the UI.

---

## 7. Routes

| Route         | Purpose                                            |
| ------------- | -------------------------------------------------- |
| `/today`      | Today page (default after sign-in)                 |
| `/progress`   | Progress & Insights (Weekly / Insights)               |
| `/habits`     | Habit management and system-habit catalog          |
| `/journal`    | Daily journal entries                              |
| `/focus`      | Focus / meditation timer                           |
| `/sign-in`    | Clerk sign-in                                      |
| `/register`   | Clerk sign-up                                      |

Settings is a modal, not a route.

---

## 8. UI / UX

- **Colourful but calm:** the app should feel friendly and bright without being loud or clinical. Colour carries meaning rather than decoration.
  - Palette: sky blue (`#D6E0E2`) page background, cloud white (`#FEFCF6`) cards, midnight (`#162A2C`) text and forest green as the main accent. Dark mode uses midnight surfaces with cream text and a sky blue accent. All text pairs are checked for 4.5:1 contrast in `lib/theme.test.ts`.
  - **Category colours:** each category has its own muted colour (e.g. health = blue, fitness = red, learning = indigo, mindfulness = pink, productivity = amber, sleep = purple, social = teal), used on tags, icon backgrounds and any category chips. They are mid-tones chosen to stay visible against the card in both light and dark mode.
  - **Habit colours:** each habit uses its chosen colour for its icon tile, progress bar, and weekly-grid cells.
  - **Stat tiles** get distinct tinted icon backgrounds (purple, orange, amber, green), as in the Today mockup.
  - Celebratory moments (completing all habits, a new best streak) use confetti or a colour burst.
  - Keep contrast accessible (text on tinted backgrounds meets WCAG AA) and never rely on colour alone to show state; completed rows also change their check icon.
- Primary actions use a forest green gradient button (e.g. "New Habit", "Regenerate report").
- A habit has its own colour (icon tile, progress bar, weekly-grid cells), but completion uses one colour for every habit: completed rows get a light green wash and a filled check with a tick; incomplete rows are plain cards with an outlined check.
- Each habit has its own colour, used in the weekly grid.
- Heatmap uses a 5-step scale from sky blue to forest green (a lighter sky blue to midnight in dark mode).
- Mobile-first layout; the designs are phone-width.
- Reference mockups: `context/research/image*.png`.

---

## 9. Development Rules

> 🚫 **Never use `prisma db push` or change the database structure directly.**

All schema changes go through migrations:

```bash
# Development: create + apply a migration
npx prisma migrate dev --name <descriptive_name>

# Production: apply existing migrations only
npx prisma migrate deploy
```

- All data access is scoped by `userId` — never trust client-supplied ownership.
- Validate all input on the server with Zod.
- **File locations:** all server actions go in `actions/[feature].ts` (e.g. `actions/habits.ts`, `actions/journal.ts`) and all custom hooks go in `hooks/useX.ts` (e.g. `hooks/useOptimisticToggle.ts`). Don't define either inside component or page files.
- **Prefer Server Actions over API routes.** The only API routes in this app are `/api/webhooks/clerk` (called by Clerk) and `/api/cron/cleanup-demos` (called by a scheduler). Everything else, including demo creation, goes through a Server Action.
- Use **Zustand** for shared client state; server data comes from server components and Server Actions.
- Use Neon branches for dev/preview databases.
- Unit test server actions and utilities with Vitest; tests mock the database.
- This Next.js version has breaking changes — read the relevant guide in `node_modules/next/dist/docs/` before writing code (see `AGENTS.md`).

---

## 10. Open Questions

- What goes in the **Settings modal**?
- Is the Insights tab above the right minimum, or should it merge into the Weekly tab entirely?
- Should a weekly habit optionally be pinned to specific weekdays, or is "N days per week, any days" enough? (The mockup only has the count.)
- Can progress go **above** the goal (e.g. 3500/3000 ml)? Assumed yes, with the bar capped at 100%.
- Should some system habits ship with a daily goal (water, meditation minutes, steps)? Assumed yes in the seed data.
- Does the Focus timer add its minutes to a linked habit's daily goal (e.g. 25 of 35 min)?
- Does the week start on Monday or Sunday (the weekly grid starts Monday)?
- How are streaks handled for skipped days: strict, or allow a grace day?
- Which **categories** ship at launch, and how big is the system-habit catalog?
- **Navigation:** the mockups have a 3-item bottom bar (Dashboard, Habits, Progress). With Journal and Focus that's 5 items; is that acceptable, or should one of them live inside another page?
- Should a Focus session linked to a habit auto-complete it, or ask for confirmation first?
- Should the Journal be linked to the "Journal" habit, so saving an entry completes it?
- What are questions 2 and 3 of the AI Habit Suggestions wizard?
- Should suggestions be limited to the system-habit catalog, or can the AI invent new habits? (Currently assumed: AI can invent them.)
- **Theme:** light and dark are both available. The app follows the OS setting by default, and the manual switch lives in the Settings modal (feature 27).
- Do habits have **reminders / notifications**?
- Should past days be editable (back-filling a missed check-in)?
- Monetization: free vs paid (e.g. AI reports as a paid feature)?

---

## 11. Reference Links

| Area                    | Link                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| Next.js                 | https://nextjs.org/docs                                             |
| React                   | https://react.dev                                                   |
| Prisma 7 docs           | https://www.prisma.io/docs                                          |
| Prisma 7 upgrade guide  | https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7             |
| Prisma config reference | https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference |
| Neon + Prisma           | https://neon.com/docs/guides/prisma                                 |
| Clerk (Next.js)         | https://clerk.com/docs/nextjs                                       |
| Gemini API              | https://ai.google.dev/gemini-api/docs                               |
| Tailwind CSS v4         | https://tailwindcss.com/docs                                        |
| shadcn/ui               | https://ui.shadcn.com                                               |
| Lucide icons            | https://lucide.dev/icons                                            |
