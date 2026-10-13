# Current Feature: Palette & Dark Mode

## Status

In Progress

## Goals

- Re-theme the app on the sky blue / cloud white / forest green / midnight palette
- Add a dark theme that follows the OS setting, with `next-themes` and the `.dark` class
- Complete habits use one colour for every habit; each habit keeps its own colour for its tile and bar
- Contrast of every text pair checked by a test

## Notes

- The manual theme switch lives in Settings (feature 27), not the navbar.
- Habit and category colours are muted mid-tones that read against the card in both themes.

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
- **Clerk Authentication:** ClerkProvider, sign-in/register pages in `app/(auth)/`, and `proxy.ts` redirects plus page-level `auth.protect()` for the app routes.
- **User Sync:** Clerk webhook upserts/deletes `User` rows, `getSessionUser()` maps sessions to users, and the browser timezone is captured (`app/api/webhooks/clerk/route.ts`, `lib/session.ts`, `actions/user.ts`).
- **Seed Catalog:** Idempotent seed of 7 categories and 70 system habits, some with daily goals, run via `npm run db:seed` (`prisma/seed.ts`, `prisma/seed-data.ts`).
- **App Shell & Navigation:** `app/(app)/` layout with a bottom tab bar on phones, a left sidebar from `md` up, `PageHeader`, placeholder pages, and a lavender theme (`components/shared/`, `app/globals.css`).
