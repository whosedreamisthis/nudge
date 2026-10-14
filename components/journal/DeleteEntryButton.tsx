"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteJournalEntry } from "@/actions/journal";
import { Button } from "@/components/ui/button";

// Asks before one day's entry is removed, then returns to the History list
export function DeleteEntryButton({ date, label }: { date: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteJournalEntry({ date });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/journal?tab=history");
    });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden />
        Delete
      </Button>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-5 text-popover-foreground shadow-xl ring-1 ring-border">
            <AlertDialog.Title className="text-lg font-bold">Delete this entry?</AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
              Your entry for {label} will be removed for good. It can&apos;t be undone.
            </AlertDialog.Description>
            {error && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Close render={<Button variant="outline" type="button" />}>
                Cancel
              </AlertDialog.Close>
              <Button variant="destructive" onClick={confirm} disabled={pending}>
                {pending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
