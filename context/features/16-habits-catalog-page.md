# Habits Catalog Page

## Goals

- `/habits` Browse tab listing system habits the user hasn't added yet
- Search by text (name and description) plus category filter, combinable
- Each row: icon, name, category and frequency tags, description, **Add** button
- Add opens the New Habit modal prefilled, then creates a habit linked to the system habit
- "New Habit" button for custom habits

## Notes

- Keep search and category in URL search params so the page stays a server component.
- Habits already added are excluded.
