# New Habit Modal

## Goals

- "New Habit" modal with: name, description, category, frequency (Daily / Weekly), target days per week (1–7), icon picker, colour picker
- Choosing 7 days shows the "Daily habit selected" hint
- Create a custom habit (no `systemHabitId`) and a first `HabitTarget`
- Open the modal from the Habits page; use Zustand for modal state

## Notes

- Zod validation on the server, scoped by `userId`.
- Icon set and 9 colours are in the mockup (`context/research`).
- Daily goal fields are added by the multi-step feature.
