import { HABIT_COLORS, type HabitColor } from "@/types/habits";

// Tailwind only generates classes it can see written out, so every colour is spelled in full
const TILE_CLASSES: Record<HabitColor, string> = {
  indigo: "bg-habit-indigo/15",
  sky: "bg-habit-sky/15",
  emerald: "bg-habit-emerald/15",
  amber: "bg-habit-amber/15",
  red: "bg-habit-red/15",
  pink: "bg-habit-pink/15",
  violet: "bg-habit-violet/15",
  teal: "bg-habit-teal/15",
  lime: "bg-habit-lime/15",
};

// Progress fill that covers a habit card from the left
const FILL_CLASSES: Record<HabitColor, string> = {
  indigo: "bg-habit-indigo/25",
  sky: "bg-habit-sky/25",
  emerald: "bg-habit-emerald/25",
  amber: "bg-habit-amber/25",
  red: "bg-habit-red/25",
  pink: "bg-habit-pink/25",
  violet: "bg-habit-violet/25",
  teal: "bg-habit-teal/25",
  lime: "bg-habit-lime/25",
};

const CATEGORY_TAG_CLASSES: Record<string, string> = {
  health: "bg-cat-health/15",
  fitness: "bg-cat-fitness/15",
  learning: "bg-cat-learning/15",
  mindfulness: "bg-cat-mindfulness/15",
  productivity: "bg-cat-productivity/15",
  sleep: "bg-cat-sleep/15",
  social: "bg-cat-social/15",
};

function isHabitColor(color: string): color is HabitColor {
  return (HABIT_COLORS as readonly string[]).includes(color);
}

// Background tint for a habit's icon tile; unknown colours fall back to indigo
export function habitTileClass(color: string) {
  return TILE_CLASSES[isHabitColor(color) ? color : "indigo"];
}

export function habitFillClass(color: string) {
  return FILL_CLASSES[isHabitColor(color) ? color : "indigo"];
}

export function categoryTagClass(categoryName: string) {
  return CATEGORY_TAG_CLASSES[categoryName] ?? "bg-muted";
}

// A solid block in the habit's colour, for completed days on the Progress grid
const SOLID_CLASSES: Record<HabitColor, string> = {
  indigo: "bg-habit-indigo",
  sky: "bg-habit-sky",
  emerald: "bg-habit-emerald",
  amber: "bg-habit-amber",
  red: "bg-habit-red",
  pink: "bg-habit-pink",
  violet: "bg-habit-violet",
  teal: "bg-habit-teal",
  lime: "bg-habit-lime",
};

export function habitSolidClass(color: string) {
  return SOLID_CLASSES[isHabitColor(color) ? color : "indigo"];
}
