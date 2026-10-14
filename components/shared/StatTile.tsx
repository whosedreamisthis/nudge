import type { ReactNode } from "react";

export interface TileProps {
  label: string;
  badge: ReactNode;
  tint: string;
  value: ReactNode;
  caption: ReactNode;
}

export function Tile({ label, badge, tint, value, caption }: TileProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl p-4 text-foreground shadow-sm ${tint}`}>
      <dt className="flex items-center gap-2 text-sm font-medium text-foreground/75">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card/70 text-lg"
        >
          {badge}
        </span>
        {label}
      </dt>
      <dd className="flex flex-col items-center text-center">
        <span className="text-4xl leading-none font-bold tabular-nums">{value}</span>
        <span className="mt-1.5 max-w-full truncate text-sm text-foreground/75">{caption}</span>
      </dd>
    </div>
  );
}

// A habit's icon on a light tile, so a yellow icon still shows on an amber card
export function HabitChip({ icon, name }: { icon: string; name: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-card/70 text-sm"
      >
        {icon}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
