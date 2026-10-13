# Habit Actions Menu

## Goals

- `…` menu on each Today habit row with Edit, Archive, and Delete
- Edit reuses the New Habit modal, prefilled
- Archive sets `archivedAt` and removes the habit from Today and stats
- Delete asks for confirmation and removes the habit and its completions, for **custom habits only**

## Notes

- The delete action must reject habits with a `systemHabitId` on the server, not just hide the menu item.
- Editing the target applies from the current week forward (new `HabitTarget` row).
