"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import {
  LayoutDashboard,
  User,
  LogOut,
  CheckSquare,
  Moon,
  Sun,
  Heart,
  BookOpen,
  X,
  Sparkles,
  Timer,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/to-do", label: "To Do List", icon: CheckSquare },
  { href: "/dashboard/habit-tracker", label: "Habit Tracker", icon: Heart },
  { href: "/dashboard/journal", label: "Growth Journal", icon: BookOpen },
  { href: "/dashboard/focus", label: "Focus Timer", icon: Timer },
  { href: "/dashboard/insights", label: "Insights", icon: TrendingUp },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = jwtDecode<{ name?: string; email?: string }>(token);
      setUser(payload);
    } catch {
      /* ignore bad token */
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`sidebar fixed md:sticky top-0 z-40 h-screen w-64 shrink-0 flex flex-col
        border-r transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0b1d18 0%, #0f241f 100%)"
            : "linear-gradient(180deg, #e8f8ec 0%, #c9e9d0 100%)",
          borderRightColor: isDark ? "rgba(174,240,201,0.10)" : "rgba(22,59,37,0.10)",
          color: isDark ? "#e7f7ee" : "#123716",
        }}
        aria-label="Primary navigation"
      >
        {/* Brand + mobile close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background:
                  "linear-gradient(145deg,#1fbf75,#108a54)",
                color: "#052818",
                boxShadow: "0 6px 18px rgba(16,138,84,0.35)",
              }}
            >
              <Sparkles size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              GrowFlow
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden gf-btn gf-btn-ghost !p-2"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User greeting */}
        <div className="px-5 pb-4">
          <div className="text-xs gf-muted uppercase tracking-wider">Welcome back</div>
          <div className="text-base font-semibold truncate">
            {user.name || user.email || "Friend"}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="px-3">
          <button
            onClick={toggleTheme}
            className="gf-btn gf-btn-ghost w-full !justify-start"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3 gf-scroll">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: active
                        ? isDark
                          ? "rgba(143,232,178,0.12)"
                          : "rgba(22,59,37,0.08)"
                        : "transparent",
                      color: active
                        ? isDark
                          ? "#8fe8b2"
                          : "#163b25"
                        : "inherit",
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {active && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full"
                        style={{
                          background: isDark ? "#8fe8b2" : "#163b25",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2">
          <button
            onClick={handleLogout}
            className="gf-btn gf-btn-ghost w-full !justify-start"
            style={{ color: "#e14c4c" }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
