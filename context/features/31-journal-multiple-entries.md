# Journal: Multiple Entries Per Day

## Goals

- Allow any number of entries per day, each with its own text and optional mood
- Replace the one-per-day rule: entries get their own id (migration drops `@@unique([userId, date])`, adds an index on `[userId, date]`)
- Today tab lists today's entries (newest first) with a "New entry" button; the first entry opens ready to write
- Autosave creates the entry on the first change, then updates it by id
- Each entry shows its time of day (Morning, Afternoon or Evening, plus the clock time) from its creation time in the user's timezone
- History shows one row per entry with date, time of day, mood and preview; search and the month and mood filters keep working
- Entry page moves to `/journal/[id]` (read, edit, delete with confirmation); entries from other users 404

## Notes

- Existing entries keep working: each becomes that day's single entry.
- Time of day: Morning before 12:00, Afternoon 12:00 to 17:59, Evening from 18:00.
- Entries are never auto-deleted, and are private; never send them to the AI.
- Empty new entries (no text, no mood) should not pile up: delete or skip saving them.
