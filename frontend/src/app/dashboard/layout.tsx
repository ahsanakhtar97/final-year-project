"use client";

import { createContext, useContext, useState } from "react";
import Sidebar from "@/app/components/sidebar";

const ThemeContext = createContext<any>(null);
export const useTheme = () => useContext(ThemeContext);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: theme === "dark" ? "#121212" : "white",
          color: theme === "dark" ? "white" : "black",
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>{children}</main>
      </div>
    </ThemeContext.Provider>
  );
}
