"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Adds or removes the `dark` class on <html>. Follows the OS setting until the user picks a theme.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
