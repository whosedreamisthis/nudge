# Today Page: Habit List

## Goals

- `/today` greeting with the current date
- List the user's active habits as rows: icon, name, category tag, description, current streak
- Empty state with a link to the Habits page
- Read-only: no completion toggling yet

## Notes

- Server component; data via a query in `lib/db/`, scoped by `userId`.
- Streak display: "13d" for daily, "12w" for weekly.
- Pale yellow row background and a check button come with the toggle feature.
