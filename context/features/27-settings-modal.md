# Settings Modal

## Goals

- Settings modal opened by a gear icon button in the top Navbar, next to the Clerk profile button (`components/shared/Navbar.tsx`), on every screen size
- Account section using Clerk `<UserProfile />` for profile, email and sign-out
- Theme setting (System / Light / Dark) using `useTheme()` from `next-themes`; the `ThemeProvider` is already in the root layout
- Timezone setting (stored on `User.timezone`), editable with a validated IANA name
- AI switch: turns off the AI Weekly Report, morning motivation and habit suggestions, with a line saying what is sent to Gemini
- Reminders: placeholder section only (disabled, "Coming soon"); no settings are stored yet
- Delete account through Clerk, with a type-to-confirm step

## Notes

- Keep it minimal; the full list is in `context/project-overview.md` section 3.8.
- Timezone change: `captureTimezone` only sets the value once (while it is still "UTC"), so editing needs its own action. Completions are stored as dates and must not be rewritten; "today" and the week boundaries move, so streaks can recalculate. Refresh the app's pages after the change.
- Delete account: the Clerk webhook cleans up our data, but it can lag. Sign the user out straight away and send them to the landing page instead of showing stale data.
- Demo users (see `29-demo-spec.md`): show only theme and sign-out. Hide Delete account and lock the timezone, since the demo expires after 12 hours.
- Phones: full-screen modal that scrolls; Clerk's profile component in its own section.
- Reminders: show the section so the layout is settled, but leave it disabled with "Coming soon". Real reminders (channel, times, per habit or global) are an open question in the overview.
- Out of scope until decided: data export.
