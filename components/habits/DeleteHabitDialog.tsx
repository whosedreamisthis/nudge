"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteHabitDialogProps {
  habitName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}

// Asks before a custom habit and all of its history are removed
export function DeleteHabitDialog({
  habitName,
  open,
  onOpenChange,
  onConfirm,
  pending,
}: DeleteHabitDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-5 text-popover-foreground shadow-xl ring-1 ring-border">
          <AlertDialog.Title className="text-lg font-bold">Delete {habitName}?</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
            This removes the habit and all of its history. It can&apos;t be undone.
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" type="button" />}>
              Cancel
            </AlertDialog.Close>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
