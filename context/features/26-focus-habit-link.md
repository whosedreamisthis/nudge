# Focus: Link to a Habit

## Goals

- Optionally link a Focus session to one of the user's habits
- Completing the session marks that habit complete for today (or adds the minutes to a minutes-based daily goal)
- Stopping early does not complete the habit

## Notes

- Reuses the completion action; don't duplicate the logic.
- Minutes: if the habit has a daily goal in minutes, finishing adds the session minutes to it; any other habit is simply marked complete.
- No session history: no "focus minutes" on Insights and no database model; the link lives in the localStorage timer state.
