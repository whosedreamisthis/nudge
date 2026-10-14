"use client";

import { Menu } from "@base-ui/react/menu";
import { Archive, Ellipsis, Hash, Pencil, Trash2, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { archiveHabit, deleteHabit, undoHabit } from "@/actions/habits";
import { DeleteHabitDialog } from "@/components/habits/DeleteHabitDialog";
import { SetAmountDialog } from "@/components/today/SetAmountDialog";
import { useNewHabitModal } from "@/lib/new-habit-store";
import { cn } from "@/lib/utils";
import type { HabitColor, TodayHabit } from "@/types/habits";

const ITEM_CLASS =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted";

interface HabitMenuProps {
  habit: TodayHabit;
  // Made-up habits are not in the database, so every action is switched off
  disabled?: boolean;
  onError: (message: string) => void;
}

// Actions menu in the bottom right of a habit row, under the completion circle. The ellipsis shows on hover and
// keyboard focus (and always on touch screens, which can't hover).
export function HabitMenu({
  habit,
  disabled = false,
  onError,
}: HabitMenuProps) {
  const openModal = useNewHabitModal((state) => state.openModal);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [settingAmount, setSettingAmount] = useState(false);
  const [pending, startTransition] = useTransition();

  function edit() {
    openModal({
      habitId: habit.id,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      categoryId: habit.categoryId,
      frequency: habit.frequency,
      targetDaysPerWeek: habit.targetDaysPerWeek,
      color: habit.color as HabitColor,
      dailyGoal: habit.progress.goal,
      unit: habit.unit,
      stepSize: habit.stepSize,
    });
  }

  function undo() {
    startTransition(async () => {
      const result = await undoHabit({ habitId: habit.id });
      if (!result.success) onError(result.error);
    });
  }

  function archive() {
    startTransition(async () => {
      const result = await archiveHabit({ habitId: habit.id });
      if (!result.success) onError(result.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteHabit({ habitId: habit.id });
      if (result.success) setConfirmingDelete(false);
      else onError(result.error);
    });
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Actions for ${habit.name}`}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none transition-opacity",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:opacity-100",
            "hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-100",
          )}
        >
          <Ellipsis aria-hidden className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4}>
            <Menu.Popup className="min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-border">
              {/* Only a habit with a daily goal has steps to undo or an amount to set */}
              {habit.progress.goal !== null && (
                <>
                  <Menu.Item
                    disabled={
                      disabled || pending || habit.progress.amount === 0
                    }
                    onClick={undo}
                    className={ITEM_CLASS}
                  >
                    <Undo2 aria-hidden className="size-4" />
                    Undo
                  </Menu.Item>
                  <Menu.Item
                    disabled={disabled}
                    onClick={() => setSettingAmount(true)}
                    className={ITEM_CLASS}
                  >
                    <Hash aria-hidden className="size-4" />
                    Set amount
                  </Menu.Item>
                </>
              )}
              <Menu.Item
                disabled={disabled}
                onClick={edit}
                className={ITEM_CLASS}
              >
                <Pencil aria-hidden className="size-4" />
                Edit
              </Menu.Item>
              <Menu.Item
                disabled={disabled || pending}
                onClick={archive}
                className={ITEM_CLASS}
              >
                <Archive aria-hidden className="size-4" />
                Archive
              </Menu.Item>
              {/* Catalog habits can only be archived; the server refuses to delete them too */}
              {habit.isCustom && (
                <Menu.Item
                  disabled={disabled}
                  onClick={() => setConfirmingDelete(true)}
                  className={cn(ITEM_CLASS, "text-destructive")}
                >
                  <Trash2 aria-hidden className="size-4" />
                  Delete
                </Menu.Item>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {habit.progress.goal !== null && (
        <SetAmountDialog
          habitId={habit.id}
          habitName={habit.name}
          unit={habit.unit}
          amount={habit.progress.amount}
          goal={habit.progress.goal}
          open={settingAmount}
          onOpenChange={setSettingAmount}
        />
      )}

      <DeleteHabitDialog
        habitName={habit.name}
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={remove}
        pending={pending}
      />
    </>
  );
}
