export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <p className="text-muted-foreground">Build habits that stick.</p>
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex gap-2">
          <span className="size-6 rounded-full bg-cat-health" />
          <span className="size-6 rounded-full bg-cat-fitness" />
          <span className="size-6 rounded-full bg-cat-learning" />
          <span className="size-6 rounded-full bg-cat-mindfulness" />
          <span className="size-6 rounded-full bg-cat-productivity" />
          <span className="size-6 rounded-full bg-cat-sleep" />
          <span className="size-6 rounded-full bg-cat-social" />
        </div>
      </div>
    </main>
  );
}
