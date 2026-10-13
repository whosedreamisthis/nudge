# Dates & Streaks Logic

## Goals

- `lib/dates.ts`: "today" and week start (Monday) in the user's timezone
- `lib/streaks.ts`: current streak, best streak, and whether a day or week is complete
- Daily habits: day streak. Weekly habits (target 1–6): week streak counting weeks where completions >= target
- A day is complete when `amount >= dailyGoal` (default 1)
- Vitest tests for edge cases (timezone boundaries, week rollover, target changes)

## Notes

- Pure functions, no database calls.
- Past weeks use the `HabitTarget` that was in effect then.
- Used by Today, Progress and the AI report.
