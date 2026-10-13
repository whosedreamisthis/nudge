# Focus Timer

## Goals

- Add the `FocusSession` model and migration
- `/focus` page: choose a duration (5 / 10 / 20 / 30 min or custom) and start a free meditation session
- Countdown with pause, resume, and stop; sound or notification at the end
- Log finished sessions (date, duration, status)
- Add Focus to the bottom navigation

## Notes

- Base the countdown on a stored end timestamp so it survives tab switches and reloads.
- Linking to habits is the next feature.
