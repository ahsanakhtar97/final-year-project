"use client";

import { createContext, useContext } from "react";

export type ColorTheme = "green" | "purple" | "blue" | "pink" | "orange" | "yellow";

export const COLOR_THEMES: { id: ColorTheme; label: string; accent: string; bg: string }[] = [
  { id: "green",  label: "Neon Green",   accent: "#6effc4", bg: "linear-gradient(135deg,#06130f,#0f2a21)" },
  { id: "purple", label: "Neon Purple",  accent: "#c084fc", bg: "linear-gradient(135deg,#0d0b1a,#160d2a)" },
  { id: "blue",   label: "Neon Blue",    accent: "#60a5fa", bg: "linear-gradient(135deg,#050b1a,#0c1a35)" },
  { id: "pink",   label: "Neon Pink",    accent: "#f472b6", bg: "linear-gradient(135deg,#1a0b14,#2d0e22)" },
  { id: "orange", label: "Neon Orange",  accent: "#fb923c", bg: "linear-gradient(135deg,#1a0f07,#2a1608)" },
  { id: "yellow", label: "Neon Yellow",  accent: "#fde047", bg: "linear-gradient(135deg,#1a1600,#2a2200)" },
];

export interface DashboardContextValue {
  theme: "light" | "dark";
  isDark: boolean;
  toggleTheme: () => void;
  isPrivate: boolean;
  togglePrivacy: () => void;
  primaryAccent: string;
  colorTheme: ColorTheme;
  setColorTheme: (t: ColorTheme) => void;
}

export const ThemeContext = createContext<DashboardContextValue | null>(null);

export const useTheme = (): DashboardContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light",
      isDark: false,
      toggleTheme: () => {},
      isPrivate: false,
      togglePrivacy: () => {},
      primaryAccent: "#6effc4",
      colorTheme: "green",
      setColorTheme: () => {},
    };
  }
  return ctx;
};
