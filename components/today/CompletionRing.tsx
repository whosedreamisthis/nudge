const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Circular "x of y complete" indicator for the Today header
export function CompletionRing({ done, total }: { done: number; total: number }) {
  const fraction = total === 0 ? 0 : done / total;

  return (
    <div
      role="img"
      aria-label={`${done} of ${total} complete`}
      className="flex shrink-0 items-center gap-3"
    >
      <svg aria-hidden viewBox="0 0 56 56" className="size-14 -rotate-90">
        <circle cx="28" cy="28" r={RADIUS} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className="stroke-complete transition-[stroke-dashoffset] duration-400 ease-out"
        />
      </svg>
      <p aria-hidden className="text-sm leading-tight text-muted-foreground tabular-nums">
        <span className="block text-lg font-semibold text-foreground">
          {done} of {total}
        </span>
        complete
      </p>
    </div>
  );
}
