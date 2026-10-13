# Database Schema

## Goals

- Set up Prisma 7 with the Neon driver adapter (`prisma.config.ts`, `lib/db.ts`)
- Add models: `User`, `Category`, `SystemHabit`, `Habit`, `HabitTarget`, `HabitCompletion`
- Create the first migration with `prisma migrate dev`
- Unique constraint on `HabitCompletion` (`habitId`, `date`)

## Notes

- Fields are listed in `context/project-overview.md` section 6. Daily goal fields (`dailyGoal`, `unit`, `stepSize`, `amount`) are included from the start.
- Env vars live in `.env.local`, not `.env`. The Prisma CLI doesn't read `.env.local` by default, so load it explicitly in `prisma.config.ts`, and use the same for `prisma/seed.ts`.
- Never use `prisma db push`.
- Use a Neon dev branch, not production.
- Journal and Focus tables come with their own features.
