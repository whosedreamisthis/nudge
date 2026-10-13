"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewHabitModal, type HabitPrefill } from "@/lib/new-habit-store";

export function AddHabitButton({ prefill }: { prefill: HabitPrefill }) {
  const openModal = useNewHabitModal((state) => state.openModal);

  return (
    <Button variant="outline" onClick={() => openModal(prefill)} aria-label={`Add ${prefill.name}`}>
      <Plus aria-hidden />
      Add
    </Button>
  );
}
