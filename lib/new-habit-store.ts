import { create } from "zustand";
import type { HabitColor } from "@/types/habits";

// Starting values when the modal is opened from the catalog instead of from scratch
// (a catalog habit to add, or with habitId an existing habit to edit)
export interface HabitPrefill {
  habitId?: string;
  systemHabitId?: string;
  color?: HabitColor;
  dailyGoal?: number | null;
  unit?: string | null;
  stepSize?: number | null;
  name: string;
  description: string;
  icon: string;
  categoryId: string;
  frequency: "DAILY" | "WEEKLY";
  targetDaysPerWeek: number;
}

interface NewHabitModalState {
  open: boolean;
  prefill: HabitPrefill | null;
  openModal: (prefill?: HabitPrefill) => void;
  closeModal: () => void;
}

export const useNewHabitModal = create<NewHabitModalState>((set) => ({
  open: false,
  prefill: null,
  openModal: (prefill) => set({ open: true, prefill: prefill ?? null }),
  // The prefill stays until the next open, so the closing animation doesn't flash an empty form
  closeModal: () => set({ open: false }),
}));
