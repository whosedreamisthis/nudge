# Clerk Authentication

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
