# Toggle Completion

## Goals

- Tapping a habit toggles it complete / incomplete for today
- Completed rows: pale yellow background and filled orange check; incomplete: white with an outlined check
- Optimistic UI update, then a Server Action
- Circular completion ring with "x of y complete" in the Today header

## Notes

- Server Action validates with Zod, scopes by `userId`, and returns `{ success, data, error }`.
- Creates or deletes the `HabitCompletion` for the user's local today.
- Vitest tests for the action.
