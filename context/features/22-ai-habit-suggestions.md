# AI Habit Suggestions

## Goals

- "Suggest a habit" button on the Habits page opens a 3-step wizard
- Step 1: "What are your goals right now?" (Next disabled until text is entered); steps 2 and 3 are quick questions
- Result: 3 suggested habits (name, description, category, icon, frequency) from the Gemini API (reuse `lib/gemini.ts`)
- Adding a suggestion opens the New Habit modal prefilled
- Cancel closes the wizard

## Notes

- Include the user's existing habits in the prompt so suggestions don't repeat them.
- Answers are used for one request and not stored.
- Questions 2 and 3 are still open in `context/project-overview.md`; pick sensible defaults and note them.
