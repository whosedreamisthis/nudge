import type { DateKey } from "@/lib/dates";

export interface StoredTarget {
  id: string;
  frequency: "DAILY" | "WEEKLY";
  targetDaysPerWeek: number;
  effectiveFrom: DateKey;
}

export type TargetChange = { type: "none" } | { type: "update"; id: string } | { type: "create" };

// How an edit changes a habit's target history. A new target starts this week, so past weeks keep
// the target they were judged by; a target that already starts this week is changed in place.
export function planTargetChange(
  targets: StoredTarget[],
  week: DateKey,
  next: { frequency: "DAILY" | "WEEKLY"; targetDaysPerWeek: number },
): TargetChange {
  const thisWeek = targets.find((t) => t.effectiveFrom === week);
  let inForce = thisWeek;
  if (!inForce) {
    for (const t of targets) {
      if (t.effectiveFrom <= week && (!inForce || t.effectiveFrom > inForce.effectiveFrom)) {
        inForce = t;
      }
    }
  }

  if (
    inForce &&
    inForce.frequency === next.frequency &&
    inForce.targetDaysPerWeek === next.targetDaysPerWeek
  ) {
    return { type: "none" };
  }
  return thisWeek ? { type: "update", id: thisWeek.id } : { type: "create" };
}
