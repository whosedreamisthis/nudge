# User Sync

## Goals

- Add `/api/webhooks/clerk` that verifies requests with `verifyWebhook()`
- Upsert the `User` on `user.created` / `user.updated`; delete the user and their data on `user.deleted`
- Add `getSessionUser()` in `lib/session.ts`: Clerk `userId` → `User` row, creating it if the webhook hasn't arrived yet
- Capture the browser timezone on first sign-in and store it on `User.timezone`
- Vitest tests with a mocked database

## Notes

- The handler must be idempotent (Clerk retries on non-2xx).
- Return 400 on a bad signature.
- Every later query is scoped by the `User.id` from this helper.
