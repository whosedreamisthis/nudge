"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewHabitModal } from "@/lib/new-habit-store";

export function NewHabitButton() {
  const openModal = useNewHabitModal((state) => state.openModal);

  return (
    <Button onClick={openModal}>
      <Plus aria-hidden />
      New Habit
    </Button>
  );
}
