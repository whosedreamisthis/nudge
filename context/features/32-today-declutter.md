# Today Declutter

## Summary

The Today page makes people scroll past two large stat tiles before they reach the habits, and a Morning motivation card (feature 21) will add more height above them. The habits are the point of the page, so move the stats off it: remove the tiles from Today and show the same numbers on the Progress page.

## Goals

- Remove the two stat tiles (Active streaks, Best streak) from the Today page, so the habits come straight after the header
- On the Progress page, replace the **Today** tile (done/total) with a **Best streak** tile
- On the Progress page, replace the **Average streak** tile with an **Active streaks** tile
- The Progress tiles become: Best streak, Active streaks, Weekly average, Top habit
- Today keeps the completion ring in its header; the consistency heatmap stays in its `aside` slot (below the habits on phones, beside them from `xl`)
- No new Today header line for active streaks (the Progress tile covers it)

## Notes

- Today renders the tiles in `components/today/TodayHabits.tsx` (the `<StatTiles stats={stats} />` block and its `xl:` grid placement). Remove it and let the habit list and the aside take the layout it freed up; check the `xl` grid still reads well (list on the left, heatmap on the right).
- `components/today/StatTiles.tsx` exports `Tile` and `HabitChip`, which `components/progress/ProgressTiles.tsx` also uses. Move them to a shared file (for example `components/shared/StatTile.tsx`) and delete the unused `StatTiles` component.
- The numbers already exist: `getTodayStats` in `lib/stats.ts` returns `activeStreaks` and `bestStreak` (`{ name, icon, unit, best }`), and `getToday` in `lib/db/today.ts` builds them from each habit's streak history. Compute them for the Progress page too (`lib/db/progress.ts` and `app/(app)/progress/page.tsx`), reusing `getTodayStats` rather than duplicating the streak logic. Then `getToday` no longer needs to return `stats`.
- `ProgressTiles` currently takes `today`, `averageStreakDays`, `weeklyAverage`, `topHabit`. Replace `today` and `averageStreakDays` with `activeStreaks` and `bestStreak`. Remove anything that only existed for the old tiles (for example the average streak calculation) if nothing else uses it.
- Keep each tile's existing look: Best streak uses the amber tint and trophy icon, Active streaks the orange tint and flame icon (as on Today now).
- Update tests: `lib/stats.test.ts`, `lib/db/today.test.ts`, `lib/db/progress.test.ts`, `lib/progress.test.ts` (whatever covered the removed pieces), and any component tests.
- The demo seed (`lib/demo-seed.ts`) is unaffected. The empty and sample states of the Today page (`getSampleToday` in `lib/sample-habits.ts`) may also pass `stats`; remove it there too.
- Do the build and check both pages at phone width and at `xl`: the Today page should show the first habit without scrolling on a phone.
