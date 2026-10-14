# Morning Motivation

## Goals

- Dismissable "Morning Motivation" card at the top of Today
- One-sentence AI message based on recent habit history
- Generate once per user per day and store it as an `AiReport` of type `motivation`
- Dismissing hides it until the next day

## Notes

- Reuses the Gemini client (`lib/gemini.ts`) and `AiReport` model from the weekly report feature.
- Skip the card for brand-new users with no history.
