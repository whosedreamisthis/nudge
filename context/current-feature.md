# Current Feature: Clerk Authentication

Add Clerk sign-in and registration, and protect the app's pages.

## Status

In Progress

## Goals

- Install `@clerk/nextjs` and wrap the app in `<ClerkProvider>`
- Add `/sign-in` and `/register` pages with Clerk components, in an `(auth)` route group: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/register/[[...register]]/page.tsx` (the group name doesn't appear in the URL), with a shared `app/(auth)/layout.tsx` that centres the form
- Protect `/today`, `/habits`, `/progress`, `/journal` and `/focus` with `clerkMiddleware()` in `proxy.ts`
- Redirect signed-in users to `/today`; keep `/sign-in`, `/register` and `/api/webhooks/*` public
- Add the Clerk env vars

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts`; confirm in the local Next.js docs.
- Use the `clerk-setup` skill if helpful.
- Placeholder `/today` page is fine for now.
- Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) are already in `.env.local`; add the sign-in/register URL and redirect variables from the project overview.
- Install packages one at a time (earlier installs stalled).

## Completed Features

- **Project Setup:** shadcn/ui, Lucide, Inter, colourful Tailwind v4 theme tokens, logo/favicon, top Navbar, and Vitest (`app/globals.css`, `components/shared/`, `vitest.config.ts`).
- **Database Schema:** Prisma 7 + Neon adapter, core habit tables, and the init migration on the dev branch (`prisma/schema.prisma`, `prisma.config.ts`, `lib/db.ts`).
