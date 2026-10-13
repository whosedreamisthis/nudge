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

// Fill colour of a native <progress> bar (WebKit and Firefox style it through different pseudo-elements)
const PROGRESS_CLASSES: Record<HabitColor, string> = {
  indigo: "[&::-webkit-progress-value]:bg-habit-indigo [&::-moz-progress-bar]:bg-habit-indigo",
  sky: "[&::-webkit-progress-value]:bg-habit-sky [&::-moz-progress-bar]:bg-habit-sky",
  emerald: "[&::-webkit-progress-value]:bg-habit-emerald [&::-moz-progress-bar]:bg-habit-emerald",
  amber: "[&::-webkit-progress-value]:bg-habit-amber [&::-moz-progress-bar]:bg-habit-amber",
  red: "[&::-webkit-progress-value]:bg-habit-red [&::-moz-progress-bar]:bg-habit-red",
  pink: "[&::-webkit-progress-value]:bg-habit-pink [&::-moz-progress-bar]:bg-habit-pink",
  violet: "[&::-webkit-progress-value]:bg-habit-violet [&::-moz-progress-bar]:bg-habit-violet",
  teal: "[&::-webkit-progress-value]:bg-habit-teal [&::-moz-progress-bar]:bg-habit-teal",
  lime: "[&::-webkit-progress-value]:bg-habit-lime [&::-moz-progress-bar]:bg-habit-lime",
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

export function habitProgressClass(color: string) {
  return PROGRESS_CLASSES[isHabitColor(color) ? color : "indigo"];
}

export function categoryTagClass(categoryName: string) {
  return CATEGORY_TAG_CLASSES[categoryName] ?? "bg-muted";
}
