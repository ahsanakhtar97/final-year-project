"use client";

// Shared theme + dashboard context.
//
// Originally lived in dashboard/layout.tsx, but Next.js App Router does not
// allow layout files to export anything other than the default component plus
// a small allow-list (metadata, viewport, generateStaticParams, etc.). Pulling
// the context out into a sibling file keeps the build happy while letting any
// dashboard page or component subscribe via `useTheme()`.

import { createContext, useContext } from "react";

export interface DashboardContextValue {
  theme: "light" | "dark";
  isDark: boolean;
  toggleTheme: () => void;
  isPrivate: boolean;
  togglePrivacy: () => void;
  primaryAccent: string;
}

export const ThemeContext = createContext<DashboardContextValue | null>(null);

export const useTheme = (): DashboardContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so destructuring doesn't crash during hydration or if a
    // component using `useTheme` ends up outside the provider tree.
    return {
      theme: "light",
      isDark: false,
      toggleTheme: () => {},
      isPrivate: false,
      togglePrivacy: () => {},
      primaryAccent: "#163b25",
    };
  }
  return ctx;
};
