"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { suggestHabits } from "@/actions/habit-suggestions";
import { Button } from "@/components/ui/button";
import {
  ANSWER_MAX_LENGTH,
  type CategoryOption,
  type HabitSuggestion,
  type SuggestionAnswers,
} from "@/lib/habit-suggestions";
import { habitTileClass } from "@/lib/habit-colors";
import { useNewHabitModal } from "@/lib/new-habit-store";
import { type WizardStep, useSuggestWizard } from "@/lib/suggest-wizard-store";
import { cn } from "@/lib/utils";

const STEPS: Record<WizardStep, { key: keyof SuggestionAnswers; question: string; placeholder: string }> = {
  1: {
    key: "goals",
    question: "What are your goals right now?",
    placeholder: "e.g. Get fitter, read more, sleep better...",
  },
  2: {
    key: "productive",
    question: "When are you most productive during the day?",
    placeholder: "e.g. Early morning, late evenings...",
  },
  3: {
    key: "struggles",
    question: "What habits have you struggled with?",
    placeholder: "e.g. Gym in the morning, journaling at night...",
  },
};

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SuggestHabitWizard({ categories }: { categories: CategoryOption[] }) {
  const open = useSuggestWizard((state) => state.open);
  const closeWizard = useSuggestWizard((state) => state.closeWizard);
  // The wizard steps aside while the New Habit modal is open and comes back, with its suggestions, after
  const habitModalOpen = useNewHabitModal((state) => state.open);

  return (
    <Dialog.Root open={open && !habitModalOpen} onOpenChange={(next) => !next && closeWizard()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl scrollbar-none bg-popover p-5 text-popover-foreground shadow-xl ring-1 ring-border">
          <WizardContent categories={categories} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WizardContent({ categories }: { categories: CategoryOption[] }) {
  const suggestions = useSuggestWizard((state) => state.suggestions);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Dialog.Title className="text-xl font-bold">Suggest a habit</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {suggestions
              ? "Add one to adjust it and start tracking."
              : "Answer three quick questions and get three ideas."}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="rounded-sm p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="size-4" />
        </Dialog.Close>
      </div>

      {suggestions ? <Results suggestions={suggestions} categories={categories} /> : <Questions />}
    </div>
  );
}

function Questions() {
  const step = useSuggestWizard((state) => state.step);
  const answers = useSuggestWizard((state) => state.answers);
  const loading = useSuggestWizard((state) => state.loading);
  const error = useSuggestWizard((state) => state.error);
  const { setAnswer, next, back, beginRequest, finishRequest } = useSuggestWizard.getState();

  const { key, question, placeholder } = STEPS[step];
  const value = answers[key];
  const last = step === 3;
  const canContinue = value.trim().length > 0 && !loading;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    if (!last) return next();

    const id = beginRequest();
    const result = await suggestHabits(useSuggestWizard.getState().answers);
    finishRequest(id, result.success ? { suggestions: result.data } : { error: result.error });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Step {step} of 3</span>
        <span className="text-sm font-medium">{question}</span>
        <textarea
          // A new field per step, so it takes focus and starts at the right height
          key={step}
          value={value}
          onChange={(e) => setAnswer(key, e.target.value)}
          maxLength={ANSWER_MAX_LENGTH}
          rows={4}
          autoFocus
          placeholder={placeholder}
          className={cn(FIELD_CLASS, "resize-none")}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={back} disabled={loading}>
            Back
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Dialog.Close render={<Button variant="outline" type="button" />}>Cancel</Dialog.Close>
          <Button type="submit" disabled={!canContinue}>
            {last ? (loading ? "Thinking…" : "Get Suggestions") : "Next"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Results({
  suggestions,
  categories,
}: {
  suggestions: HabitSuggestion[];
  categories: CategoryOption[];
}) {
  const added = useSuggestWizard((state) => state.added);
  const { back, closeWizard, markAdded } = useSuggestWizard.getState();

  // Opens the New Habit modal prefilled with the pick; the other suggestions stay for the next one
  function add(suggestion: HabitSuggestion) {
    useNewHabitModal.getState().openModal({
      ...suggestion,
      color: "indigo",
      onCreated: () => markAdded(suggestion.name),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.name}
            className="flex items-start gap-3 rounded-lg border border-border p-3"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg text-xl",
                habitTileClass("indigo"),
              )}
            >
              {suggestion.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{suggestion.name}</p>
              {suggestion.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{suggestion.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {suggestion.systemHabitId && "From the catalog · "}
                {categories.find((category) => category.id === suggestion.categoryId)?.name} ·{" "}
                {suggestion.frequency === "DAILY"
                  ? "Daily"
                  : `${suggestion.targetDaysPerWeek} ${suggestion.targetDaysPerWeek === 1 ? "day" : "days"} a week`}
              </p>
            </div>
            <Button
              size="sm"
              variant={added.includes(suggestion.name) ? "outline" : "default"}
              disabled={added.includes(suggestion.name)}
              onClick={() => add(suggestion)}
            >
              {added.includes(suggestion.name) ? "Added" : "Add"}
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={back}>
          Back
        </Button>
        <Button type="button" variant="outline" className="ml-auto" onClick={closeWizard}>
          {added.length > 0 ? "Done" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
