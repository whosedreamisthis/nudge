// Shown while the Journal pages load; the nav around it appears straight away
export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your journal">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:max-w-xs" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
