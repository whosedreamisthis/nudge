// Shown while the Habits page loads; the nav around it appears straight away
export default function HabitsLoading() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading habits">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-56 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
