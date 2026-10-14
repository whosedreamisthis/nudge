"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { createHabit, updateHabit } from "@/actions/habits";
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

const COPY = {
  create: {
    title: "New Habit",
    description: "Create your own habit to track.",
    submit: "Create habit",
    pending: "Creating…",
  },
  add: {
    title: "Add Habit",
    description: "Adjust it if you like, then add it to your habits.",
    submit: "Add habit",
    pending: "Adding…",
  },
  edit: {
    title: "Edit Habit",
    description:
      "A new target applies from this week; earlier weeks keep theirs.",
    submit: "Save changes",
    pending: "Saving…",
  },
};

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const LABEL_CLASS = "text-sm font-medium";

export function NewHabitModal({
  categories,
}: {
  categories: CategoryOption[];
}) {
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
  const prefill = useNewHabitModal((state) => state.prefill);
  const [name, setName] = useState(prefill?.name ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    prefill?.categoryId ?? categories[0]?.id ?? "",
  );
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">(
    prefill?.frequency ?? "DAILY",
  );
  const [days, setDays] = useState(prefill?.targetDaysPerWeek ?? 7);
  const [icon, setIcon] = useState<string>(prefill?.icon ?? HABIT_ICONS[0]);
  const [color, setColor] = useState<HabitColor>(prefill?.color ?? "indigo");
  // Kept as text while typing; an empty goal means a plain done / not done habit
  const [goal, setGoal] = useState(prefill?.dailyGoal?.toString() ?? "");
  const [unit, setUnit] = useState(prefill?.unit ?? "");
  const [step, setStep] = useState(prefill?.stepSize?.toString() ?? "");
  const editingId = prefill?.habitId;
  const copy = editingId ? COPY.edit : prefill ? COPY.add : COPY.create;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // A catalog icon outside the picker's choices still has to be selectable
  const icons: readonly string[] = HABIT_ICONS.includes(icon as never)
    ? HABIT_ICONS
    : [icon, ...HABIT_ICONS];

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
      const fields = {
        name,
        description,
        categoryId,
        frequency,
        targetDaysPerWeek: days,
        icon,
        color,
        dailyGoal: goal.trim() ? Number(goal) : null,
        unit: goal.trim() ? unit.trim() : null,
        // A goal with no step adds 1 per tap
        stepSize: goal.trim() ? Number(step.trim() || 1) : null,
      };
      const result = editingId
        ? await updateHabit({ ...fields, habitId: editingId })
        : await createHabit({
            ...fields,
            ...(prefill?.systemHabitId && {
              systemHabitId: prefill.systemHabitId,
            }),
          });
      if (result.success) {
        prefill?.onCreated?.();
        onDone();
      }
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Dialog.Title className="text-xl font-bold">
            {copy.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {copy.description}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="rounded-sm p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
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
                "rounded-sm border px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                frequency === option
                  ? "border-primary bg-primary/10"
                  : "border-border",
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
                "rounded-sm border py-2 text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>
          Daily goal{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            aria-label="Goal amount"
            placeholder="Goal, e.g. 8"
            className={FIELD_CLASS}
          />
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            maxLength={12}
            aria-label="Unit"
            placeholder="Unit, e.g. glasses"
            className={FIELD_CLASS}
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={step}
            onChange={(e) => setStep(e.target.value)}
            aria-label="Amount added per tap"
            placeholder="Per tap (1)"
            className={FIELD_CLASS}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Leave empty for a simple done / not done habit. A new goal counts from
          now on.
        </p>
        <p className="text-sm text-muted-foreground">
          Example: a goal of 8, unit &quot;glasses&quot; and 1 per tap shows 0/8
          glasses on Today. Each tap adds a glass, and the habit is done at 8/8.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={cn(LABEL_CLASS, "mb-1.5")}>Icon</legend>
        <div className="grid grid-cols-10 gap-1">
          {icons.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Icon ${option}`}
              aria-pressed={icon === option}
              onClick={() => setIcon(option)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === option
                  ? cn("ring-2 ring-primary", habitTileClass(color))
                  : "hover:bg-muted",
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
                color === option &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
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
        <Dialog.Close render={<Button variant="outline" type="button" />}>
          Cancel
        </Dialog.Close>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? copy.pending : copy.submit}
        </Button>
      </div>
    </form>
  );
}
