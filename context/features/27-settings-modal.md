# Settings Modal

## Goals

- Settings modal opened from the app header
- Clerk `<UserButton />` / profile for account, email, and sign-out
- Timezone setting (stored on `User.timezone`)
- Delete account through Clerk (the webhook cleans up our data)

## Notes

- Not designed yet; keep it minimal.
- Add a theme setting (System / Light / Dark) using `useTheme()` from `next-themes`; the `ThemeProvider` is already in the root layout.
- Reminders and data export are out of scope until decided.
