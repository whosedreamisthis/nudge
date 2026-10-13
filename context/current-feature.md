# Current Feature: Database Schema

Set up Prisma 7 with Neon and define the core habit tables with the first migration.

## Status

In Progress

## Goals

- Set up Prisma 7 with the Neon driver adapter (`prisma.config.ts`, `lib/db.ts`)
- Add models: `User`, `Category`, `SystemHabit`, `Habit`, `HabitTarget`, `HabitCompletion`
- Create the first migration with `prisma migrate dev`
- Unique constraint on `HabitCompletion` (`habitId`, `date`)

## Notes

- Fields are listed in `context/project-overview.md` section 6. Daily goal fields (`dailyGoal`, `unit`, `stepSize`, `amount`) are included from the start.
- Env vars live in `.env.local`. The Prisma CLI doesn't read `.env.local` by default, so load it explicitly in `prisma.config.ts`, and use the same for `prisma/seed.ts`.
- Never use `prisma db push`.
- Use a Neon development branch, not production.
- Journal and Focus tables come with their own features.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
