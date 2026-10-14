"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { generateWeeklyReport } from "@/actions/ai-report";
import { Button } from "@/components/ui/button";
import type { StoredReport } from "@/lib/db/ai-report";

function generatedLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

// This week's AI report. A stored report is shown as is; with none yet (and a habit to report
// on) it is generated once on the first visit, with a loading state and a retry on failure.
export function AiWeeklyReport({
  initial,
  timezone,
  aiEnabled,
  hasHabits,
}: {
  initial: StoredReport | null;
  timezone: string;
  aiEnabled: boolean;
  hasHabits: boolean;
}) {
  const [report, setReport] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const started = useRef(false);
  const hasReport = useRef(Boolean(initial));

  const canGenerate = aiEnabled && hasHabits;

  function run(regenerate: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await generateWeeklyReport({ regenerate });
      if (result.success) {
        hasReport.current = true;
        setReport(result.data);
      }
      else setError(result.error);
    });
  }

  useEffect(() => {
    if (initial || !canGenerate || started.current) return;
    started.current = true;
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The page can stay mounted (hidden) while the user is on another page; coming back should not
  // show an old "try again later" message, so it is dropped when the page is left. A failed first
  // generation keeps its message and Try again button.
  useEffect(
    () => () => {
      if (hasReport.current) setError(null);
    },
    [],
  );

  if (!aiEnabled && !report) return null;

  return (
    <section
      aria-labelledby="ai-report-heading"
      aria-busy={pending}
      className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="ai-report-heading"
          className="flex items-center gap-2 text-sm font-medium text-foreground/75"
        >
          <Sparkles aria-hidden className="size-4 text-primary" />
          Weekly report
        </h2>
        {report && canGenerate && (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(true)}>
            <RefreshCw aria-hidden className={pending ? "animate-spin" : undefined} />
            Regenerate report
          </Button>
        )}
      </div>

      {report ? (
        <div className={pending ? "opacity-60" : undefined}>
          <p className="mt-3 text-sm leading-relaxed">{report.summary}</p>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {report.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Generated {generatedLabel(report.generatedAt, timezone)}
          </p>
        </div>
      ) : pending ? (
        <div role="status" className="mt-3 flex flex-col gap-2">
          <span className="sr-only">Generating your weekly report</span>
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ) : !hasHabits ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Add a habit and your weekly report will show up here.
        </p>
      ) : null}

      {error && (
        <div role="alert" className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-destructive">{error}</span>
          {!report && (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => run(false)}>
              Try again
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
