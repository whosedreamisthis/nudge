# AI Weekly Report

## Goals

- Weekly tab card with a narrative summary and 3 actionable insights, generated with the Gemini API (`GEMINI_API_KEY`, one shared client in `lib/gemini.ts`)
- Add the `AiReport` model and migration
- Store one report per user per week; reuse it on later visits
- "Regenerate report" button overwrites the stored report; show the generated-at time
- Loading and error states

## Notes

- Build the prompt from this week's completions, streaks, and targets only.
- Generate server-side; never expose `GEMINI_API_KEY` to the client.
- Check the current Gemini SDK and model names in the docs before coding; use a fast, low-cost model.
- Rate-limit regeneration.
