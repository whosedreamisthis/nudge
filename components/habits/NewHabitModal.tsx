"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { createHabit } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { HABIT_ICONS, isDailyTarget } from "@/lib/habit-form";
import { habitTileClass } from "@/lib/habit-colors";
import { useNewHabitModal } from "@/lib/new-habit-store";
import { cn } from "@/lib/utils";
import { HABIT_COLORS, type HabitColor } from "@/types/habits";

export interface CategoryOption {
  id: string;
  name: string;
}

const SWATCH_CLASSES: Record<HabitColor, string> = {
  indigo: "bg-habit-indigo",
  sky: "bg-habit-sky",
  emerald: "bg-habit-emerald",
  amber: "bg-habit-amber",
  red: "bg-habit-red",
  pink: "bg-habit-pink",
  violet: "bg-habit-violet",
  teal: "bg-habit-teal",
  lime: "bg-habit-lime",
};

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const LABEL_CLASS = "text-sm font-medium";

export function NewHabitModal({ categories }: { categories: CategoryOption[] }) {
  const { open, closeModal } = useNewHabitModal();

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && closeModal()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl scrollbar-none bg-popover p-5 text-popover-foreground shadow-xl ring-1 ring-border">
          {/* Mounts on each open, so the form starts empty every time */}
          <NewHabitForm categories={categories} onDone={closeModal} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NewHabitForm({
  categories,
  onDone,
}: {
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [days, setDays] = useState(7);
  const [icon, setIcon] = useState<(typeof HABIT_ICONS)[number]>(HABIT_ICONS[0]);
  const [color, setColor] = useState<HabitColor>("indigo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chooseFrequency(next: "DAILY" | "WEEKLY") {
    setFrequency(next);
    setDays(next === "DAILY" ? 7 : 3);
  }

  // Picking all seven days is a daily habit; anything fewer is weekly
  function chooseDays(next: number) {
    setDays(next);
    setFrequency(next === 7 ? "DAILY" : "WEEKLY");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createHabit({
        name,
        description,
        categoryId,
        frequency,
        targetDaysPerWeek: days,
        icon,
        color,
      });
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Dialog.Title className="text-xl font-bold">New Habit</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Create your own habit to track.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="size-4" />
        </Dialog.Close>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          placeholder="e.g. Read 10 pages"
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="Optional"
          className={cn(FIELD_CLASS, "resize-none")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Category</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={FIELD_CLASS}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>Frequency</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["DAILY", "WEEKLY"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={frequency === option}
              onClick={() => chooseFrequency(option)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                frequency === option ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              {option === "DAILY" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>Days per week</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={days === n}
              onClick={() => chooseDays(n)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                days === n ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {/* Always takes its line, so the form below doesn't jump when the hint appears */}
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {isDailyTarget(frequency, days) && "Daily habit selected"}
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>Icon</legend>
        <div className="grid grid-cols-10 gap-1">
          {HABIT_ICONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Icon ${option}`}
              aria-pressed={icon === option}
              onClick={() => setIcon(option)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === option ? cn("ring-2 ring-primary", habitTileClass(color)) : "hover:bg-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>Colour</legend>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={option}
              aria-pressed={color === option}
              onClick={() => setColor(option)}
              className={cn(
                "size-7 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
                SWATCH_CLASSES[option],
                color === option && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
              )}
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Dialog.Close render={<Button variant="outline" type="button" />}>Cancel</Dialog.Close>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Creating…" : "Create habit"}
        </Button>
      </div>
    </form>
  );
}
