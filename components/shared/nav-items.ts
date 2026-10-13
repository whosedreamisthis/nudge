import { BookOpen, ChartColumn, LayoutDashboard, ListChecks, Timer } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: ChartColumn },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/focus", label: "Focus", icon: Timer },
];
