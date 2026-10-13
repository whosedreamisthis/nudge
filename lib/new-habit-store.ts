import { create } from "zustand";

interface NewHabitModalState {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useNewHabitModal = create<NewHabitModalState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));
