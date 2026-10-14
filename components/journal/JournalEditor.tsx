"use client";

import { useEffect, useRef, useState } from "react";
import { saveJournalEntry } from "@/actions/journal";
import { MAX_ENTRY_LENGTH, MOODS, formatEntryTime } from "@/lib/journal";
import { cn } from "@/lib/utils";

const SAVE_DELAY_MS = 800;

type SaveState = "saved" | "saving" | "error";

interface JournalEditorProps {
  // null for a new entry; it is created on the first change
  entryId: string | null;
  initialContent: string;
  initialMood: number | null;
  // ISO creation time, null until a new entry is saved
  createdAt: string | null;
  timezone: string;
  // Courier Prime's class, set by the page
  fontClassName: string;
  // Move the cursor into the text on mount
  autoFocus?: boolean;
  // Called once a new entry has been created
  onCreated?: (id: string) => void;
}

// One entry: changes are saved on their own shortly after you stop typing
export function JournalEditor({
  entryId,
  initialContent,
  initialMood,
  createdAt,
  timezone,
  fontClassName,
  autoFocus,
  onCreated,
}: JournalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<number | null>(initialMood);
  const [created, setCreated] = useState(createdAt);
  const [status, setStatus] = useState<SaveState>("saved");
  const id = useRef(entryId);
  const latest = useRef({ content: initialContent, mood: initialMood });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirty = useRef(false);
  // Saves run one after another, so a create always finishes before the next update needs its id
  const queue = useRef<Promise<void>>(Promise.resolve());
  const textarea = useRef<HTMLTextAreaElement>(null);

  async function save() {
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    const result = await saveJournalEntry({ id: id.current ?? undefined, ...latest.current });
    if (!result.success) {
      setStatus("error");
      return;
    }
    if (result.data) {
      id.current = result.data.id;
      setCreated(result.data.createdAt);
      onCreated?.(result.data.id);
    }
    // Edits made while saving schedule their own save and keep the "saving" label
    if (!dirty.current) setStatus("saved");
  }

  function flush() {
    clearTimeout(timer.current);
    queue.current = queue.current.then(save);
  }

  function change(next: { content: string; mood: number | null }) {
    latest.current = next;
    dirty.current = true;
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  useEffect(() => {
    if (autoFocus) textarea.current?.focus();
  }, [autoFocus]);

  // Leaving the page or hiding the tab saves what is pending
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
    // flush only reads refs, and the first render's copy is as good as any
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold">
        {created ? formatEntryTime(new Date(created), timezone) : "New entry"}
      </p>

      {/* The label sits above the faces on phones and beside them from sm up */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm text-muted-foreground">How are you feeling?</span>
        <div role="radiogroup" aria-label="Mood" className="flex items-center gap-2">
          {MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={m.label}
                title={m.label}
                onClick={() => {
                  // Tapping the chosen mood again clears it
                  const next = selected ? null : m.value;
                  setMood(next);
                  change({ content, mood: next });
                }}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xl ring-1 ring-border transition",
                  selected ? "bg-primary/15 ring-2 ring-primary" : "opacity-60 hover:opacity-100",
                )}
              >
                {m.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        ref={textarea}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          change({ content: e.target.value, mood });
        }}
        maxLength={MAX_ENTRY_LENGTH}
        placeholder="What's on your mind?"
        aria-label="Journal entry"
        className={cn(
          "min-h-56 w-full resize-y rounded-2xl bg-card p-4 text-base leading-relaxed ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring",
          fontClassName,
        )}
      />

      <p
        role="status"
        className={cn("text-sm text-muted-foreground", status === "error" && "text-destructive")}
      >
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved"}
        {status === "error" && "Could not save, we'll try again as you type"}
      </p>
    </div>
  );
}
