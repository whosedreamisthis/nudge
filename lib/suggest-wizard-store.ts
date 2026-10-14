import { create } from "zustand";
import type { HabitSuggestion, SuggestionAnswers } from "@/lib/habit-suggestions";

export type WizardStep = 1 | 2 | 3;

type RequestResult = { suggestions: HabitSuggestion[] } | { error: string };

interface SuggestWizardState {
  open: boolean;
  step: WizardStep;
  answers: SuggestionAnswers;
  // null until a request has finished; non-null shows the results
  suggestions: HabitSuggestion[] | null;
  // Names of the suggestions already added as habits, so each can only be added once
  added: string[];
  loading: boolean;
  error: string | null;
  // Tells a late reply to an abandoned request apart from the current one
  requestId: number;
  openWizard: () => void;
  closeWizard: () => void;
  setAnswer: (key: keyof SuggestionAnswers, value: string) => void;
  next: () => void;
  // From the results this returns to step 3, from a step to the one before; answers are kept
  back: () => void;
  markAdded: (name: string) => void;
  beginRequest: () => number;
  finishRequest: (id: number, result: RequestResult) => void;
}

const EMPTY_ANSWERS: SuggestionAnswers = { goals: "", productive: "", struggles: "" };

export const useSuggestWizard = create<SuggestWizardState>()((set, get) => ({
  open: false,
  step: 1,
  answers: EMPTY_ANSWERS,
  suggestions: null,
  added: [],
  loading: false,
  error: null,
  requestId: 0,
  // Every open starts clean: the answers are for one request and are not kept
  openWizard: () =>
    set((state) => ({
      open: true,
      step: 1,
      answers: EMPTY_ANSWERS,
      suggestions: null,
      added: [],
      loading: false,
      error: null,
      requestId: state.requestId + 1,
    })),
  // The content stays until the next open, so the closing animation doesn't flash an empty dialog
  closeWizard: () => set((state) => ({ open: false, loading: false, requestId: state.requestId + 1 })),
  setAnswer: (key, value) => set((state) => ({ answers: { ...state.answers, [key]: value } })),
  next: () => set((state) => ({ step: state.step < 3 ? ((state.step + 1) as WizardStep) : 3 })),
  back: () =>
    set((state) =>
      state.suggestions
        ? { suggestions: null, error: null }
        : { step: state.step > 1 ? ((state.step - 1) as WizardStep) : 1, error: null },
    ),
  markAdded: (name) => set((state) => ({ added: [...state.added, name] })),
  beginRequest: () => {
    const requestId = get().requestId + 1;
    set({ loading: true, error: null, requestId });
    return requestId;
  },
  finishRequest: (id, result) => {
    if (get().requestId !== id) return;
    set("suggestions" in result ? { loading: false, suggestions: result.suggestions, added: [] } : { loading: false, error: result.error });
  },
}));
