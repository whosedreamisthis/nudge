"use client";

import { Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dismissMotivation, generateMotivation } from "@/actions/motivation";
import { Button } from "@/components/ui/button";
import type { StoredMotivation } from "@/lib/motivation";

// Today's one-sentence AI message. A stored message is shown as is; with none yet it is generated
// once on the first visit of the day (the page renders without waiting for Gemini). A failure
// leaves the card out. Dismissing hides it until the next day.
export function MorningMotivation({
  initial,
  canGenerate,
}: {
  initial: StoredMotivation | null;
  canGenerate: boolean;
}) {
  const [message, setMessage] = useState(initial);
  const started = useRef(false);

  useEffect(() => {
    if (initial || !canGenerate || started.current) return;
    started.current = true;
    generateMotivation().then((result) => {
      if (result.success) setMessage(result.data);
    });
  }, [initial, canGenerate]);

  if (!message || message.dismissed) return null;

  function dismiss() {
    setMessage({ ...message!, dismissed: true });
    void dismissMotivation();
  }

  return (
    <section
      aria-labelledby="motivation-heading"
      className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border xl:col-span-2"
    >
      <Sun aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <h2 id="motivation-heading" className="text-sm font-medium text-foreground/75">
          Morning Motivation
        </h2>
        <p className="mt-1 text-sm leading-relaxed">{message.message}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss morning motivation"
        onClick={dismiss}
      >
        <X aria-hidden />
      </Button>
    </section>
  );
}
