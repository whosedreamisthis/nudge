import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyHabits() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-8 text-center text-card-foreground shadow-sm ring-1 ring-border">
      <span aria-hidden className="text-4xl">
        🌱
      </span>
      <h2 className="text-lg font-semibold">No habits yet</h2>
      <p className="text-sm text-muted-foreground">
        Pick a few from the catalog, or create your own, and they will show up here.
      </p>
      <Button nativeButton={false} render={<Link href="/habits" />}>
        Browse habits
      </Button>
    </div>
  );
}
