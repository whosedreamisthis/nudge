# AI Habit Suggestions

## Goals

- "Suggest a habit" button on the Habits page opens a 3-step wizard
- Step 1: "What are your goals right now?" (Next disabled until text is entered); step 2: "When are you most productive during the day?"; step 3: "What habits have you struggled with?"
- Result: 3 suggested habits (name, description, category, icon, frequency) from the Gemini API (reuse `lib/gemini.ts`)
- Adding a suggestion opens the New Habit modal prefilled
- Steps 2 and 3 are free-text boxes; step 2 placeholder "e.g. Early morning, late evenings...", step 3 placeholder "e.g. Gym in the morning, journaling at night..."
- Buttons: Back (steps 2 and 3 only, returns to the previous step with answers kept), Cancel on every step, Next on steps 1 and 2, "Get Suggestions" on step 3 (generates the results); the primary button is disabled until the field has text
- Cancel closes the wizard

## Notes

- Include the user's existing habits in the prompt so suggestions don't repeat them.
- Answers are used for one request and not stored.
- Pass all three answers to Gemini; use the productive time of day to suggest when each habit fits, and the struggled habits to avoid or adapt similar suggestions.
