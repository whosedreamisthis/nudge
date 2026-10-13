"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteHabit } from "@/actions/habits";
import { DeleteHabitDialog } from "@/components/habits/DeleteHabitDialog";
import { RestoreHabitButton } from "@/components/habits/RestoreHabitButton";
import { Button } from "@/components/ui/button";

interface ArchivedHabitActionsProps {
  habitId: string;
  habitName: string;
  // Catalog habits can only be restored; the server refuses to delete them too
  isCustom: boolean;
}

export function ArchivedHabitActions({ habitId, habitName, isCustom }: ArchivedHabitActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteHabit({ habitId });
      if (result.success) setConfirming(false);
      else {
        setConfirming(false);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <RestoreHabitButton habitId={habitId} habitName={habitName} />
        {isCustom && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${habitName}`}
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-destructive">
          {error}
        </p>
      )}
      <DeleteHabitDialog
        habitName={habitName}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={remove}
        pending={pending}
      />
    </div>
  );
}
