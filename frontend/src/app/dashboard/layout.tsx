"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/app/components/sidebar";
import CommandPalette from "@/app/components/command-palette";
import Onboarding from "@/app/components/onboarding";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { clearAuth, isJwtExpired } from "@/lib/auth";
import { isProfessionalRole, type UserRole } from "@/lib/role";
import { jwtDecode } from "jwt-decode";
import { ThemeContext, type ColorTheme } from "@/app/dashboard/theme-context";
import { COLOR_THEMES } from "@/app/dashboard/theme-context";
import type { SceneVariant } from "@/app/components/ambient-scene";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getUnreadCount } from "@/app/actions/reminders";
import { getUserId } from "@/lib/utils";

// Three.js touches `window` on import; keep this client-only.
const AmbientScene = dynamic(
  () => import("@/app/components/ambient-scene"),
  { ssr: false, loading: () => null },
);

/** Map a dashboard route to the 3D shape that fits its purpose.
 *  Every route gets a unique variant -- no shape is reused anywhere. */
function variantForPath(path: string): SceneVariant {
  if (path.startsWith("/dashboard/profile")) return "octa";
  if (path.startsWith("/dashboard/journal")) return "ribbon";
  if (path.startsWith("/dashboard/achievements")) return "crystal";
  if (path.startsWith("/dashboard/to-do")) return "cube";
  if (path.startsWith("/dashboard/habit-tracker")) return "spiral";
  if (path.startsWith("/dashboard/goals")) return "cone";
  if (path.startsWith("/dashboard/focus")) return "torus";
  if (path.startsWith("/dashboard/calendar")) return "cylinder";
  if (path.startsWith("/dashboard/settings")) return "tetra";
  if (path.startsWith("/dashboard/coach")) return "particles";
  if (path.startsWith("/dashboard/insights")) return "lattice";
  return "orbit"; // dashboard home (everything-orbits-around-you)
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("green");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadReminders, setUnreadReminders] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const sceneVariant = useMemo(
    () => variantForPath(pathname ?? "/dashboard"),
    [pathname],
  );

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

  // Hydrate colour theme
  useEffect(() => {
    const saved = localStorage.getItem("color_theme") as ColorTheme | null;
    if (saved) setColorThemeState(saved);
  }, []);

  // Apply data-color-theme attribute + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", colorTheme);
    localStorage.setItem("color_theme", colorTheme);
  }, [colorTheme]);

  const setColorTheme = (t: ColorTheme) => setColorThemeState(t);

  // Auth guard. We not only require a token but also check that it isn't
  // expired -- otherwise the user lingers on the dashboard until the first
  // failing request, which is a confusing UX.
  //
  // We also enforce a SOFT role boundary: providers belong inside
  // /dashboard/provider, patients belong outside it. Either side trying
  // to navigate to the other's subtree is bounced to their own home.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || isJwtExpired(token)) {
      clearAuth();
      router.replace("/login");
      return;
    }

    // Role gating.
    let role: UserRole = "patient";
    try {
      const payload = jwtDecode<{ role?: UserRole }>(token);
      role = payload.role ?? "patient";
    } catch {
      /* fall through with default */
    }
    const inProviderArea = pathname?.startsWith("/dashboard/provider") ?? false;
    if (isProfessionalRole(role) && !inProviderArea) {
      router.replace("/dashboard/provider");
      return;
    }
    if (!isProfessionalRole(role) && inProviderArea) {
      router.replace("/dashboard");
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
  }, [router, pathname]);

  // Poll unread reminders count
  useEffect(() => {
    if (!isAuthChecked) return;
    const uid = getUserId();
    if (!uid) return;
    const poll = () => getUnreadCount(uid).then(setUnreadReminders).catch(() => {});
    poll();
    const interval = window.setInterval(poll, 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthChecked]);

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
  const primaryAccent = COLOR_THEMES.find(t => t.id === colorTheme)?.accent ?? "#6effc4";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        isPrivate,
        togglePrivacy,
        primaryAccent,
        colorTheme,
        setColorTheme,
      }}
    >
      <div
        className="relative flex min-h-screen"
        style={{
          background: "var(--gf-bg)",
          color: "var(--gf-text)",
          transition: "background 500ms ease, color 300ms ease",
        }}
      >
        {/* Ambient 3D scene -- fixed behind sidebar + content. Variant is
            driven by the active route so each surface gets its own shape. */}
        <AmbientScene
          variant={sceneVariant}
          mode={isDark ? "dark" : "light"}
          intensity={0.55}
          position="background"
        />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <CommandPalette />
        <Onboarding />

        <div className="relative z-10 flex flex-1 flex-col min-w-0">
          {/* Mobile topbar */}
          <header
            className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: isDark
                ? `rgba(var(--gf-glass-dark-rgb, 6,19,15), 0.85)`
                : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottomColor: "var(--gf-border)",
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
            <Link
              href="/dashboard/reminders"
              className="gf-btn gf-btn-ghost !p-2 relative"
              aria-label="Reminders"
            >
              <Bell size={20} />
              {unreadReminders > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: "#e14c4c", color: "#fff" }}
                >
                  {unreadReminders > 9 ? "9+" : unreadReminders}
                </span>
              )}
            </Link>
          </header>

          <main
            className="flex-1 overflow-y-auto gf-scroll px-4 py-5 md:px-6 md:py-6 lg:px-8"
            style={{ minWidth: 0 }}
          >
            <ErrorBoundary label="this page">{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
