# Multi-Step Habits

## Goals

- Optional daily goal in the New Habit modal: amount, unit, step size
- Today row shows a progress bar and amount (e.g. "2500/3000 ml") instead of a single check
- Tap adds one step; `…` menu has undo and "set exact amount"
- The habit counts as complete only when `amount >= dailyGoal`
- Progress can exceed the goal; the bar caps at 100%

## Notes

- Partial progress never counts toward streaks, the ring, or the weekly grid.
- Reaching 0 deletes the `HabitCompletion` row.
- Vitest tests for the increment / undo / set-amount actions.
