# Demo Try Flow

## Summary

A **Try demo** button creates a temporary, isolated Clerk user with seeded sample habits. **Each IP address gets exactly one demo at a time**: pressing Try demo again from the same IP signs the visitor back into that same demo, while different IPs get separate demos. Expiry then frees the IP to create a new demo.

Depends on: `29a-demo-data-and-cleanup.md` (migration, seed, expiry and cleanup job must exist first).

## Goals

- **Try demo** button on the landing and sign-in / register pages
- On press (Server Action `startDemo()` in `actions/demo.ts`; no API route, it sets the resume cookie, signs the visitor in and redirects):
  1. **IP lookup:** look the caller's IP up in Redis. If it maps to a live demo, mint a Clerk sign-in token for that demo user, sign the visitor in, and redirect to `/today`. No new Clerk user is created.
  2. **Cookie fallback:** if the IP has no live demo but the visitor has a valid, unexpired resume cookie (e.g. their IP changed), sign them back into that demo.
  3. Otherwise claim the IP slot, then create a Clerk user through the Backend API (generated unique email/username, no real credentials, `publicMetadata: { isDemo: true, demoExpiresAt }`).
  4. Create the `User` row (`isDemo = true`, `demoExpiresAt = now + 12h`, timezone from the browser). Use an upsert that sets `isDemo` and `demoExpiresAt` in `update` too: the webhook or `getSessionUser` can create a plain row first, and the 29a cleanup only finds rows marked `isDemo`.
  5. Seed sample data with `seedDemoUser` from 29a.
  6. Sign the visitor in, set the resume cookie, redirect to `/today`.
- Banner for demo users: "Demo: your data will be deleted in X hours. Register to keep your habits" linking to `/register`.
- **Demos cannot be converted to real accounts.** Visitors who want persistence register normally and start fresh.
- Resume cookie: httpOnly, secure, signed, holds the demo's `clerkId`, expires with the demo. If the demo has expired, the cookie is ignored and cleared.
- Extend the 29a cleanup job to delete the expired demo's IP key too.

## One demo per IP (Upstash)

- **Upstash Redis** with an atomic claim: `SET demo:ip:<hash> <clerkId> NX EX 43200` (12 h). `@upstash/ratelimit` is not needed.
- Key is a hash of the client IP (from trusted proxy headers such as `x-forwarded-for`); the raw IP is never stored.
- The TTL equals the demo lifetime, so the slot frees itself. The cleanup job also deletes the key, and a failed creation deletes it immediately.
- `NX` makes the claim race-safe: if two presses race, the loser deletes the Clerk user and DB rows it just created and signs into the winner's demo.
- Lookup is a plain `GET`: a hit means resume, a miss means create.
- **Fail closed:** if Upstash is unreachable, block new demos (the action returns an error: "Demos are temporarily unavailable, please try again shortly") to protect the Clerk user quota. Cookie resume still works.
- **Accepted trade-off:** everyone behind a shared IP (office, school, mobile carrier) lands in the same demo and can see each other's changes. Demo data is throwaway.

## Interaction with the Clerk webhook

- `user.created` fires for demo users too. The webhook upserts by `clerkId`, so no duplicate `User`.

## AI features for demo users

Regenerate-report and habit suggestions must be disabled or tightly rate-limited for demo users, so a public demo can't use up the Gemini quota or run up costs. Those features (`20`, `22`) do not exist yet; each applies this rule when it is built.

## Env vars

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `DEMO_COOKIE_SECRET` (signs the resume cookie)

## Acceptance criteria

- Two different IPs get two separate demos; edits in one never appear in the other.
- The same IP, from any browser or device, resumes the same demo with all its changes and creates no new Clerk user.
- Two simultaneous requests from one IP leave exactly one demo.
- A visitor whose IP changed but who holds the resume cookie lands back in their demo.
- Once a demo expires, the same IP can create a new one.
- After 12 hours the demo session and cookie no longer work (expiry itself is covered by 29a).
- If Upstash is down, new demos return the unavailable error and no Clerk user is created; cookie resume still works.
- If any creation step fails midway, partially created Clerk and DB data is cleaned up.
- IP-claim handling and `startDemo()` have Vitest tests (database, Clerk and Upstash mocked).

## Notes

- Never use `prisma db push`; schema changes go through migrations.
