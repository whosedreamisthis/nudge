// Shown while the Focus page checks its habit link; the nav around it appears straight away
export default function FocusLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading focus timer">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
