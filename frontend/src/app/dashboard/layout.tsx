"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/sidebar";
import CommandPalette from "@/app/components/command-palette";
import Onboarding from "@/app/components/onboarding";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { clearAuth, isJwtExpired } from "@/lib/auth";
import { ThemeContext } from "@/app/dashboard/theme-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const togglePrivacy = () => setIsPrivate((p) => !p);

  // Hydrate theme from storage / system preference
  useEffect(() => {
    const saved = localStorage.getItem("global_theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(saved ?? (prefersDark ? "dark" : "light"));
  }, []);

  // Apply `dark` class + persist
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("global_theme", theme);
  }, [theme]);

  // Auth guard. We not only require a token but also check that it isn't
  // expired -- otherwise the user lingers on the dashboard until the first
  // failing request, which is a confusing UX.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || isJwtExpired(token)) {
      clearAuth();
      router.replace("/login");
      return;
    }
    setIsAuthChecked(true);

    // Re-check on tab focus + at a 60s interval so a session that expires
    // while the tab is open boots the user instead of failing silently.
    const recheck = () => {
      const t = localStorage.getItem("accessToken");
      if (!t || isJwtExpired(t)) {
        clearAuth();
        router.replace("/login");
      }
    };
    const interval = window.setInterval(recheck, 60_000);
    window.addEventListener("focus", recheck);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", recheck);
    };
  }, [router]);

  // Close drawer when route changes / on resize up
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="gf-skeleton h-12 w-48 rounded-lg" />
      </div>
    );
  }

  const isDark = theme === "dark";
  const primaryAccent = isDark ? "#8fe8b2" : "#163b25";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        isPrivate,
        togglePrivacy,
        primaryAccent,
      }}
    >
      <div
        className="flex min-h-screen"
        style={{
          background: isDark
            ? "linear-gradient(180deg,#06130f,#0f2a21)"
            : "linear-gradient(180deg,#eafff0,#cdecd4)",
          color: isDark ? "#e7f7ee" : "#123716",
          transition: "background 500ms ease, color 300ms ease",
        }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <CommandPalette />
        <Onboarding />

        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile topbar */}
          <header
            className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: isDark
                ? "rgba(6,19,15,0.85)"
                : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottomColor: isDark
                ? "rgba(174,240,201,0.10)"
                : "rgba(22,59,37,0.10)",
            }}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="gf-btn gf-btn-ghost !p-2"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span
              className="font-bold tracking-tight"
              style={{ fontFamily: "'Lora', serif" }}
            >
              GrowFlow
            </span>
            <span className="w-10" />
          </header>

          <main
            className="flex-1 overflow-y-auto gf-scroll px-4 py-5 md:px-6 md:py-6 lg:px-8"
            style={{ minWidth: 0 }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
