# Demo Account

## Summary

A **Try demo** button creates a temporary, isolated Clerk user with seeded sample habits. **Each IP address gets exactly one demo at a time**: pressing Try demo again from the same IP signs the visitor back into that same demo, while different IPs get separate demos. After 12 hours the Clerk user and the database user (with all of its rows) are deleted, which also frees that IP to create a new demo. Clerk is never left holding unused demo users.

Depends on: `03-clerk-auth`, `04-user-sync`, `05-seed-catalog`, and the Today / Progress features it seeds data for.

## Goals

- **Try demo** button on the landing and sign-in / register pages
- On press (server action or route handler):
  1. **IP lookup:** look the caller's IP up in Redis. If it maps to a live demo, mint a Clerk sign-in token for that demo user, sign the visitor in, and redirect to `/today`. No new Clerk user is created.
  2. **Cookie fallback:** if the IP has no live demo but the visitor has a valid, unexpired resume cookie (e.g. their IP changed), sign them back into that demo.
  3. Otherwise claim the IP slot, then create a Clerk user through the Backend API (generated unique email/username, no real credentials, `publicMetadata: { isDemo: true, demoExpiresAt }`).
  4. Create the `User` row (`isDemo = true`, `demoExpiresAt = now + 12h`, timezone from the browser).
  5. Seed sample data (see Demo seed).
  6. Sign the visitor in, set the resume cookie, redirect to `/today`.
- Banner for demo users: "Demo: your data will be deleted in X hours. Register to keep your habits" linking to `/register`.
- **Demos cannot be converted to real accounts.** Visitors who want persistence register normally and start fresh.
- **Expiry** after 12 hours: delete the Clerk user, then the DB `User` (everything cascades). Also enforced at request time: a demo whose `demoExpiresAt` has passed is signed out and blocked even if the cleanup job hasn't run.
- Resume cookie: httpOnly, secure, signed, holds the demo's `clerkId`, expires with the demo. If the demo has expired, the cookie is ignored and cleared.

## Demo seed

`lib/demo-seed.ts` creates, relative to "now" in the user's timezone so the app looks alive:

- 5 habits from the catalog and custom ones: a daily habit, a multi-step habit with a daily goal (water), and a weekly habit (e.g. 3 days/week)
- About 14 weeks of generated completions with realistic gaps (fills the heatmap, streaks and weekly grid)
- A few journal entries and one Focus session
- A pre-generated weekly report stored as `AiReport`, so the demo does not call the Gemini API

**The seed grows with the app:** each later feature that adds user-created data extends `lib/demo-seed.ts` and its test as part of that feature. Only new demos get new rows.

AI features are limited for demo users: regenerate-report and habit suggestions are disabled or tightly rate-limited so a public demo can't use up the Gemini quota or run up costs.

## One demo per IP (Upstash)

- **Upstash Redis** with an atomic claim: `SET demo:ip:<hash> <clerkId> NX EX 43200` (12 h). `@upstash/ratelimit` is not needed.
- Key is a hash of the client IP (from trusted proxy headers such as `x-forwarded-for`); the raw IP is never stored.
- The TTL equals the demo lifetime, so the slot frees itself. The cleanup job also deletes the key, and a failed creation deletes it immediately.
- `NX` makes the claim race-safe: if two presses race, the loser deletes the Clerk user and DB rows it just created and signs into the winner's demo.
- Lookup is a plain `GET`: a hit means resume, a miss means create.
- **Fail closed:** if Upstash is unreachable, block new demos (HTTP 503, "Demos are temporarily unavailable, please try again shortly") to protect the Clerk user quota. Cookie resume still works.
- **Accepted trade-off:** everyone behind a shared IP (office, school, mobile carrier) lands in the same demo and can see each other's changes. Demo data is throwaway.

## Data (needs a migration via `prisma migrate dev`)

- `User.isDemo Boolean @default(false)` and `User.demoExpiresAt DateTime?` with an index.
- No rate-limit table; state lives in Upstash.

## Cleanup job

- Scheduled job (Vercel Cron hitting a protected route, or another scheduler) at least hourly. Vercel Hobby limits cron to once a day, so on Hobby either use an external scheduler or accept up to 24 h of lag, relying on request-time expiry meanwhile.
- **Expired demos:** find users where `isDemo` and `demoExpiresAt < now`. For each, delete the Clerk user first, then the DB user, then the IP key, in batches. If the Clerk delete fails, leave the DB row so the next run retries; never delete the DB row while the Clerk user may still exist.
- **Orphan sweep:** also list Clerk users with `publicMetadata.isDemo` that are expired or have no DB row (creation failed midway) and delete them.
- Idempotent; protected by `CRON_SECRET`.

## Routes

- `POST /api/demo` (or a server action): create or resume a demo
- `GET /api/cron/cleanup-demos`: expiry job

## Env vars

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`
- `DEMO_COOKIE_SECRET` (signs the resume cookie)

## Interaction with the Clerk webhook

- `user.created` fires for demo users too. The webhook upserts by `clerkId`, so no duplicate `User`.
- `user.deleted` from the cleanup job must be a no-op if the DB user is already gone.

## Acceptance criteria

- Two different IPs get two separate demos; edits in one never appear in the other.
- The same IP, from any browser or device, resumes the same demo with all its changes and creates no new Clerk user.
- Two simultaneous requests from one IP leave exactly one demo.
- A visitor whose IP changed but who holds the resume cookie lands back in their demo.
- Once a demo expires, the same IP can create a new one.
- After 12 hours the Clerk user and DB rows are gone, and the demo session and cookie no longer work.
- The cleanup job removes expired demos and orphans, and retries a failed Clerk delete on the next run.
- If Upstash is down, new demos return 503 and no Clerk user is created; cookie resume still works.
- If any creation step fails midway, partially created Clerk and DB data is cleaned up.
- Seeding, IP-claim handling and cleanup have Vitest tests (database, Clerk and Upstash mocked).

## Notes

- Open question: do demo users count toward Clerk user limits on the current plan?
- Never use `prisma db push`; schema changes go through migrations.
