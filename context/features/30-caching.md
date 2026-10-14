# Caching

## Goals

- Cache the data the app reads most so pages stop hitting the database on every request
- Shared catalog data (categories and system habits) cached for a long time, invalidated only when the seed changes
- Per-user reads (Today, Progress grid, heatmap, insights, archived list) cached per user and per day, and invalidated the moment that user changes a habit or a completion
- Journal reads (today's entries, History list, month filter, single entry) cached per user and invalidated when that user saves or deletes an entry
- Progress page reads (week grid, heatmap, insights) explicitly covered: current week keyed by `today`, past weeks long-lived, all invalidated by habit and completion changes
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
  - `user:{id}:journal` for journal entries (Today tab, History, month filter, entry page)
- **Invalidation:** call `updateTag(...)` from the Server Actions in `actions/habits.ts` and `actions/user.ts` (read-your-own-writes: the next read waits for fresh data). Keep the existing `revalidatePath` calls until each page is moved over, then remove the ones the tags make redundant. Webhook and other non-action code uses `revalidateTag(tag, "max")`, since `updateTag` only works in Server Actions.
- **Lifetimes:** catalog `days`; per-user data `hours` (tags do the real invalidation, the lifetime is the safety net). Today and the current week depend on the date, so `today` is part of the key and yesterday's entry is simply never read again.
- **A timezone change** changes `today` and the week boundaries, so `updateTimezone` must expire `user:{id}:habits` and `user:{id}:completions`.
- **Past weeks:** the Progress grid for an earlier week only changes when someone edits that week, so it can use a long lifetime with the same tags.
- **Progress page:** the grid, heatmap and insights functions in `lib/db/` take `userId`, `timezone` and the week or range as arguments. Current week and heatmap end date include `today` in the key; they share the `completions` and `habits` tags (a habit change alters the grid rows).
- **Journal** (`lib/db/journal.ts`):
  - Cache `getEntriesForDay(userId, day)`, `getEntryById(userId, id)`, `getHistory(userId, filters)` and `getEntryMonths(userId)` with `cacheTag("user:{id}:journal")` and `cacheLife("hours")`. `userId` is always part of the key, so `getEntryById` can never return another user's entry (it still returns null for entries that aren't theirs).
  - `getHistory` filters (`q`, `month`, `mood`, `limit`) are arguments and so part of the key. Free-text searches create many one-off entries; that is fine with a short lifetime, or skip caching when `q` is set.
  - `deleteJournalEntry` calls `updateTag("user:{id}:journal")` alongside its existing `revalidatePath("/journal")`.
  - **Autosave is the exception.** `saveJournalEntry` deliberately does not refresh the page so typing isn't interrupted. It must still expire the journal tag, but check that `updateTag` doesn't trigger a client refresh mid-typing; if it does, use `revalidateTag("user:{id}:journal", "max")` there (the next visit may briefly show the previous text) and rely on the editor holding the live text. Verify with a manual test: type, navigate to History, confirm the new text appears.
  - Entry content is private and never cached anywhere shared; it stays in the per-user tag only.
- **Do not cache:** `getSessionUser()` (it upserts), the Navbar user menu, and anything that writes.
- **Serverless caveat:** the default in-memory cache does not persist between requests on serverless hosting, and it does not carry over to a new deploy. Self-hosted gets the full benefit. If this app runs on serverless, evaluate `"use cache: remote"` (Redis or KV) before relying on the speed-up, and measure before and after.
- **Tests:** `lib/db/*.test.ts` mock `prisma`; also mock `next/cache` (`cacheLife`, `cacheTag`) there. Add a test that each mutating action (including `saveJournalEntry` and `deleteJournalEntry`) calls `updateTag` with the right tags and that no cached function reads a runtime API.
- Build with `npm run build` and watch for blocking-route and `next-request-in-use-cache` errors; they are the main failure mode.
- Keep the demo (`29a-demo-data-and-cleanup.md` and `29b-demo-try-flow.md`) in mind: when a demo user is deleted, its tags just stop being read; no cleanup is needed.
