// Shown while the Progress page loads; the nav around it appears straight away
export default function ProgressLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading progress">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
