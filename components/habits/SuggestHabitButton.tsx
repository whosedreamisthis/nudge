"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSuggestWizard } from "@/lib/suggest-wizard-store";

export function SuggestHabitButton() {
  const openWizard = useSuggestWizard((state) => state.openWizard);

  return (
    <Button variant="outline" onClick={openWizard}>
      <Sparkles aria-hidden />
      Suggest a habit
    </Button>
  );
}
