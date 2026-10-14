# Focus Timer

## Goals

- `/focus` page: choose a duration (5 / 10 / 20 / 30 min or custom) and start a free meditation session
- Countdown with pause, resume, and stop
- Sound and a Web Notification when the timer finishes, including when the tab is hidden
- Persist timer state in localStorage (no database model, no session history)
- Add Focus to the bottom navigation

## Notes

- Store one localStorage key with `{ endsAt, durationMs, status, remainingMs, habitId? }`.
- Base the countdown on the stored end timestamp so it survives tab switches and reloads.
- Do not pause when the tab is hidden. Recompute from `endsAt` on `visibilitychange` and show the finish state if it has passed.
- Request notification permission when the user starts their first timer, not on page load.
- Read localStorage in an effect so server and client render the same HTML (avoid hydration mismatch).
- Navigating to another route leaves the timer running in localStorage. Finish is only detected while `/focus` is mounted or the tab is in the background (acceptable for v1).
- Linking to habits is the next feature: `/focus?habit=<id>` shows the habit name in the heading, and on finish offers a "Mark habit complete" confirmation (default on). Stopping early does not complete the habit.
