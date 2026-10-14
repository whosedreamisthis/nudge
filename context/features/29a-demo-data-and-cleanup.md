# Demo Data and Expiry

## Summary

The backend half of the demo account: how a demo user is marked, seeded with sample habits, expired and deleted. Nothing here is visible to visitors yet; the Try demo button and the per-IP lock come in `29b-demo-try-flow.md`. Build this first, so no demo user can exist before the code that deletes it. After 12 hours the Clerk user and the database user (with all of its rows) are deleted, and Clerk is never left holding unused demo users.

Depends on: `03-clerk-auth`, `04-user-sync`, `05-seed-catalog`, and the Today / Progress features it seeds data for.

## Goals

- Migration: `User.isDemo Boolean @default(false)` and `User.demoExpiresAt DateTime?` with an index
- Demo Clerk users carry `publicMetadata: { isDemo: true, demoExpiresAt }`, so the cleanup job can find them (a helper in `lib/demo.ts` builds it)
- `lib/demo-seed.ts`: `seedDemoUser(userId, timezone)` creates the sample data below
- **Request-time expiry:** a demo whose `demoExpiresAt` has passed is signed out and blocked even if the cleanup job hasn't run
- **Cleanup job** `GET /api/cron/cleanup-demos`, protected by `CRON_SECRET`
- Clerk webhook: `user.created` is safe for demo users, and `user.deleted` is a no-op if the DB user is already gone
- Demo users see only theme and sign-out in Settings (see `27-settings-modal.md`)

## Demo seed

`lib/demo-seed.ts` creates, relative to "now" in the user's timezone so the app looks alive:

- 5 habits from the catalog and custom ones: a daily habit, a multi-step habit with a daily goal (water), and a weekly habit (e.g. 3 days/week)
- About 14 weeks of generated completions with realistic gaps (fills the heatmap, streaks and weekly grid)
- A few journal entries

**The seed grows with the app:** each later feature that adds user-created data extends `lib/demo-seed.ts` and its test as part of that feature. Only new demos get new rows. The pre-generated weekly report (`AiReport`) is added by `20-ai-weekly-report`, which owns that model, so the demo never calls the Gemini API.

## Cleanup job

- Scheduled job (Vercel Cron hitting the protected route, or another scheduler) at least hourly. Vercel Hobby limits cron to once a day, so on Hobby either use an external scheduler or accept up to 24 h of lag, relying on request-time expiry meanwhile.
- **Expired demos:** find users where `isDemo` and `demoExpiresAt < now`. For each, delete the Clerk user first, then the DB user (everything cascades), in batches. If the Clerk delete fails, leave the DB row so the next run retries; never delete the DB row while the Clerk user may still exist.
- **Orphan sweep:** also list Clerk users with `publicMetadata.isDemo` that are expired or have no DB row (creation failed midway) and delete them.
- Idempotent; protected by `CRON_SECRET`.
- `29b` extends this job to also delete the expired demo's IP key.

## Routes

- `GET /api/cron/cleanup-demos`: expiry job (an API route because a scheduler calls it)

## Env vars

- `CRON_SECRET`

## Acceptance criteria

- A seeded demo user fills the heatmap, streaks and weekly grid, with a few journal entries.
- Once `demoExpiresAt` has passed, the demo session no longer works, even before cleanup runs.
- The cleanup job removes expired demos and orphans, and retries a failed Clerk delete on the next run.
- The cleanup job is idempotent and rejects requests without `CRON_SECRET`.
- `user.deleted` for a user already gone from the database does nothing and does not fail.
- Seeding, expiry and cleanup have Vitest tests (database and Clerk mocked).

## Notes

- Open question: do demo users count toward Clerk user limits on the current plan?
- To try it without the button, create a demo user by hand (or a test helper) and run the job.
- Never use `prisma db push`; schema changes go through migrations.
