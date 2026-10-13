# Nudge

A simple, colourful habit tracker. Check habits off each day, watch your streaks grow, and get short AI-written feedback on how the week went.

> **Status:** early development. Project setup is done; the features below are planned, in the order listed in [context/features/](context/features/README.md).

## Planned features

- **Today:** tap a habit to complete it, with a daily progress ring, streaks, and a 14-week consistency heatmap
- **Flexible habits:** daily or N days per week, plus multi-step habits with a progress bar (e.g. 2500/3000 ml of water)
- **Habits catalog:** browse and search 70 built-in habits across 7 categories, or create your own
- **Progress:** weekly grid, a small insights tab, and an AI weekly report
- **Journal:** daily entries with a browsable history
- **Focus:** a timer for meditation or any habit
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

Environment variables go in `.env.local` (not `.env`). See `.env.example` for the keys.

| Command         | What it does               |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm test`      | Run Vitest unit tests      |
| `npm run lint`  | Run ESLint                 |

## Project docs

- [context/project-overview.md](context/project-overview.md): product, data model, architecture
- [context/features/](context/features/README.md): small, ordered feature specs
- [context/coding-standards.md](context/coding-standards.md): conventions (server actions in `actions/`, hooks in `hooks/`)
- [context/current-feature.md](context/current-feature.md): the feature in progress and the list of completed ones

Schema changes always go through Prisma migrations (`prisma migrate dev`), never `prisma db push`.
