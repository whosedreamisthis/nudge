// Shown while the Today page loads the user's habits; the nav around it appears straight away
export default function TodayLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your habits">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-border"
          >
            <div className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
