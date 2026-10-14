# Caching

## Goals

- Cache the data the app reads most so pages stop hitting the database on every request
- Shared catalog data (categories and system habits) cached for a long time, invalidated only when the seed changes
- Per-user reads (Today, Progress grid, heatmap, insights, archived list) cached per user and per day, and invalidated the moment that user changes a habit or a completion
- No stale screens after a change: every Server Action that writes data invalidates the tags it affects, so the user sees their own change straight away
- No user can ever see another user's data from the cache

## Notes

- `cacheComponents: true` is already on in `next.config.ts`, but nothing uses `"use cache"` yet. Read `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and `09-revalidating.md` first (see `AGENTS.md`).
- Use the `"use cache"` directive on the data functions in `lib/db/` (data-level caching), each with `cacheLife(...)` and `cacheTag(...)`. Do not cache whole pages: they read the session and the clock.
- **Runtime APIs stay outside the cache.** A cached function cannot call `auth()`, `cookies()` or `getSessionUser()`. Read the user first, then pass `userId`, `timezone` and `today` in as arguments; arguments become the cache key, so each user and each day gets its own entry.
- **Tags** (one per kind of data, so a write only expires what it changes):
  - `catalog` for categories and system habits (shared by everyone)
  - `user:{id}:habits` for the active habit list, targets and archived habits
  - `user:{id}:completions` for completions, which feed Today, the heatmap, the grid and insights
- **Invalidation:** call `updateTag(...)` from the Server Actions in `actions/habits.ts` and `actions/user.ts` (read-your-own-writes: the next read waits for fresh data). Keep the existing `revalidatePath` calls until each page is moved over, then remove the ones the tags make redundant. Webhook and other non-action code uses `revalidateTag(tag, "max")`, since `updateTag` only works in Server Actions.
- **Lifetimes:** catalog `days`; per-user data `hours` (tags do the real invalidation, the lifetime is the safety net). Today and the current week depend on the date, so `today` is part of the key and yesterday's entry is simply never read again.
- **A timezone change** changes `today` and the week boundaries, so `updateTimezone` must expire `user:{id}:habits` and `user:{id}:completions`.
- **Past weeks:** the Progress grid for an earlier week only changes when someone edits that week, so it can use a long lifetime with the same tags.
- **Do not cache:** `getSessionUser()` (it upserts), the Navbar user menu, and anything that writes.
- **Serverless caveat:** the default in-memory cache does not persist between requests on serverless hosting, and it does not carry over to a new deploy. Self-hosted gets the full benefit. If this app runs on serverless, evaluate `"use cache: remote"` (Redis or KV) before relying on the speed-up, and measure before and after.
- **Tests:** `lib/db/*.test.ts` mock `prisma`; also mock `next/cache` (`cacheLife`, `cacheTag`) there. Add a test that each mutating action calls `updateTag` with the right tags and that no cached function reads a runtime API.
- Build with `npm run build` and watch for blocking-route and `next-request-in-use-cache` errors; they are the main failure mode.
- Keep the demo (`29-demo-spec.md`) in mind: when a demo user is deleted, its tags just stop being read; no cleanup is needed.
