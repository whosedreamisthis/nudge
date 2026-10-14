# Nudge

A simple, colourful habit tracker. Check habits off each day, watch your streaks grow, and get short AI-written feedback on how the week went.

> **Status:** feature complete, including data caching. The ordered specs are in [context/features/](context/features/README.md).

## Features

- **Today:** tap a habit to complete it, with a daily progress ring, streaks, a 14-week consistency heatmap, and a dismissable AI morning motivation
- **Flexible habits:** daily or N days per week, plus multi-step habits with a progress bar (e.g. 2500/3000 ml of water)
- **Habits catalog:** browse and search 70 built-in habits across 7 categories, create your own, archive and restore, or let AI suggest three habits from a short wizard
- **Progress:** weekly grid, insights tab, streak tiles, and an AI weekly report
- **Journal:** any number of entries per day with an optional mood, autosave, and a searchable history filtered by month and mood (entries are private and never sent to the AI)
- **Focus:** a timer for meditation or any habit, which can count towards a linked habit
- **Settings:** light/dark theme, timezone, and a switch for each AI feature
- **Demo:** a temporary demo account, deleted after 12 hours

See [context/project-overview.md](context/project-overview.md) for the full overview.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Neon (PostgreSQL) · Prisma 7 · Clerk · Gemini API · Upstash Redis · Zustand · Vitest

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables go in `.env.local` (not `.env`). See `.env.example` for the keys. Set `AI_DISABLED=true` to use mock AI responses instead of calling Gemini.

| Command         | What it does               |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm test`      | Run Vitest unit tests      |
| `npm run lint`  | Run ESLint                 |

## Caching

Cache Components is on. Data functions in `lib/db/` use `"use cache"` with per-user tags (`user:{id}:habits`, `user:{id}:completions`, `user:{id}:journal`) and a shared `catalog` tag. Server Actions expire the tags they change with `updateTag` (see `lib/cache-tags.ts`). Cached functions never read the session; the user, timezone and date are passed in as arguments. The default in-memory cache does not persist on serverless hosting.

## Project docs

- [context/project-overview.md](context/project-overview.md): product, data model, architecture
- [context/features/](context/features/README.md): small, ordered feature specs
- [context/coding-standards.md](context/coding-standards.md): conventions (server actions in `actions/`, hooks in `hooks/`)
- [context/current-feature.md](context/current-feature.md): the feature in progress and the list of completed ones

Schema changes always go through Prisma migrations (`prisma migrate dev`), never `prisma db push`.
