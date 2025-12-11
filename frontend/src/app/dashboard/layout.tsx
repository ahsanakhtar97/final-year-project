"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Sidebar from "@/app/components/sidebar";
import { useRouter } from "next/navigation";

const ThemeContext = createContext<any>(null);
export const useTheme = () => useContext(ThemeContext);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();

  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  // ⭐ VERY IMPORTANT — apply dark mode class to <html> for Tailwind
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // 🔒 Auth protection: redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthChecked(true); // allow rendering after check
    }
  }, [router]);

  // while checking auth, render nothing
  if (!isAuthChecked) return null;

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
