"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { Button } from "@/components/ui/button";

export interface TodayEntry {
  id: string;
  content: string;
  mood: number | null;
  createdAt: string;
}

interface Item {
  // Stable across a draft's first save, so the editor keeps its cursor
  key: string;
  id: string | null;
  content: string;
  mood: number | null;
  createdAt: string | null;
}

interface TodayEntriesProps {
  // The Today/History tabs, shown on the same row as the New entry button
  tabs: React.ReactNode;
  entries: TodayEntry[];
  timezone: string;
  fontClassName: string;
}

// Today's entries, newest first. "New entry" adds a blank one on top; it is only saved once
// something is typed or a mood is picked, so unused drafts leave nothing behind.
export function TodayEntries({ tabs, entries, timezone, fontClassName }: TodayEntriesProps) {
  const [items, setItems] = useState<Item[]>(() =>
    entries.length > 0
      ? entries.map((entry) => ({ key: entry.id, ...entry }))
      : [blankItem()],
  );
  const hasDraft = items.some((item) => item.id === null);

  return (
    <div className="flex flex-col gap-6">
      {/* The tabs shrink to leave room for the button */}
      <div className="flex items-stretch gap-2">
        {tabs}
        {/* h-auto so it grows to the tab bar's height */}
        <Button
          className="ml-auto h-auto shrink-0"
          disabled={hasDraft}
          onClick={() => setItems((current) => [blankItem(), ...current])}
        >
          <Plus aria-hidden />
          New entry
        </Button>
      </div>

      <ul className="flex flex-col gap-8">
        {items.map((item, index) => (
          <li key={item.key}>
            <JournalEditor
              entryId={item.id}
              initialContent={item.content}
              initialMood={item.mood}
              createdAt={item.createdAt}
              timezone={timezone}
              fontClassName={fontClassName}
              // The page opens ready to write, and so does a freshly added draft
              autoFocus={item.id === null && index === 0}
              onCreated={(id) =>
                setItems((current) =>
                  current.map((other) => (other.key === item.key ? { ...other, id } : other)),
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function blankItem(): Item {
  return { key: crypto.randomUUID(), id: null, content: "", mood: null, createdAt: null };
}
