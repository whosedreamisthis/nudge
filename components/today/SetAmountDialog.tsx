"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useState, useTransition } from "react";
import { setHabitAmount } from "@/actions/habits";
import { Button } from "@/components/ui/button";

interface SetAmountDialogProps {
  habitId: string;
  habitName: string;
  unit: string | null;
  // Today's amount so far, the field's starting value
  amount: number;
  goal: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Types in today's exact amount for a habit with a daily goal, instead of tapping step by step
export function SetAmountDialog({
  habitId,
  habitName,
  unit,
  amount,
  goal,
  open,
  onOpenChange,
}: SetAmountDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-5 text-popover-foreground shadow-xl ring-1 ring-border">
          {/* Mounts on each open, so the field starts from the current amount */}
          <SetAmountForm
            habitId={habitId}
            habitName={habitName}
            unit={unit}
            amount={amount}
            goal={goal}
            onDone={() => onOpenChange(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SetAmountForm({
  habitId,
  habitName,
  unit,
  amount,
  goal,
  onDone,
}: Omit<SetAmountDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void;
}) {
  const [value, setValue] = useState(String(amount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setHabitAmount({ habitId, amount: Number(value) });
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Dialog.Title className="text-lg font-bold">
          Set amount for {habitName}
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted-foreground">
          Today&apos;s goal is {goal} {unit}. You can go past it, and 0 clears
          today.
        </Dialog.Description>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Amount today{unit && ` (${unit})`}
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          required
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Dialog.Close render={<Button variant="outline" type="button" />}>
          Cancel
        </Dialog.Close>
        <Button type="submit" disabled={pending || value.trim() === ""}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
