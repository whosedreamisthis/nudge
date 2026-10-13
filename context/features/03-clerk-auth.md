# Clerk Authentication

## Goals

- Install `@clerk/nextjs` and wrap the app in `<ClerkProvider>`
- Add `/sign-in` and `/register` pages with Clerk components
- Protect `/today`, `/habits`, `/progress`, `/journal` and `/focus` with `clerkMiddleware()` in `proxy.ts`
- Redirect signed-in users to `/today`; keep `/sign-in`, `/register` and `/api/webhooks/*` public
- Add the Clerk env vars

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts`; confirm in the local Next.js docs.
- Use the `clerk-setup` skill if helpful.
- Placeholder `/today` page is fine for now.
