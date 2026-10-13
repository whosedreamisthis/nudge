"use client";

import { Menu } from "@base-ui/react/menu";
import { Archive, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted";

// Actions menu in the bottom right of a habit row, under the completion circle. The ellipsis shows on hover and
// keyboard focus (and always on touch screens, which can't hover). The actions arrive with the
// habit actions feature.
export function HabitMenu({ habitName }: { habitName: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Actions for ${habitName}`}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-opacity",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:opacity-100",
          "hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-100",
        )}
      >
        <Ellipsis aria-hidden className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4}>
          <Menu.Popup className="min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-border">
            <Menu.Item disabled className={ITEM_CLASS}>
              <Pencil aria-hidden className="size-4" />
              Edit
            </Menu.Item>
            <Menu.Item disabled className={ITEM_CLASS}>
              <Archive aria-hidden className="size-4" />
              Archive
            </Menu.Item>
            <Menu.Item disabled className={cn(ITEM_CLASS, "text-destructive")}>
              <Trash2 aria-hidden className="size-4" />
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
