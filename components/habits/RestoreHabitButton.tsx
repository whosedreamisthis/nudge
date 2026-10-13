"use client";

import { RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { restoreHabit } from "@/actions/habits";
import { Button } from "@/components/ui/button";

export function RestoreHabitButton({ habitId, habitName }: { habitId: string; habitName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore() {
    setError(null);
    startTransition(async () => {
      const result = await restoreHabit({ habitId });
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        onClick={restore}
        disabled={pending}
        aria-label={`Restore ${habitName}`}
      >
        <RotateCcw aria-hidden />
        {pending ? "Restoring…" : "Restore"}
      </Button>
      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
