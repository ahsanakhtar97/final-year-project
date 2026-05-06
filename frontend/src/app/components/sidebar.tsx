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
  Target,
  Calendar,
  Settings,
  Stethoscope,
  ClipboardList,
  Briefcase,
  FileText,
  Users,
  LifeBuoy,
  Smile,
  Gamepad2,
  Bell,
} from "lucide-react";
import { useTheme, COLOR_THEMES } from "@/app/dashboard/theme-context";

type Role = "patient" | "psychiatrist" | "psychologist";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const PATIENT_NAV: NavItem[] = [
  { href: "/dashboard",                label: "Dashboard",      icon: LayoutDashboard },
  { href: "/dashboard/to-do",          label: "To Do List",     icon: CheckSquare },
  { href: "/dashboard/habit-tracker",  label: "Habit Tracker",  icon: Heart },
  { href: "/dashboard/goals",          label: "Goals",          icon: Target },
  { href: "/dashboard/journal",        label: "Growth Journal", icon: BookOpen },
  { href: "/dashboard/focus",          label: "Focus Timer",    icon: Timer },
  { href: "/dashboard/sleep",          label: "Sleep",          icon: Moon },
  { href: "/dashboard/mood",           label: "Mood",           icon: Smile },
  { href: "/dashboard/games",          label: "Mind Games",     icon: Gamepad2 },
  { href: "/dashboard/calendar",       label: "Calendar",       icon: Calendar },
  { href: "/dashboard/coach",          label: "Coach",          icon: Sparkles },
  { href: "/dashboard/insights",       label: "Insights",       icon: TrendingUp },
  { href: "/dashboard/achievements",   label: "Achievements",   icon: Trophy },
  { href: "/dashboard/buddies",        label: "Buddies",        icon: Users },
  { href: "/dashboard/reports",        label: "Weekly Reports", icon: FileText },
  { href: "/dashboard/care",           label: "Care",           icon: Stethoscope },
  { href: "/dashboard/appointments",   label: "Appointments",   icon: ClipboardList },
  { href: "/dashboard/reminders",      label: "Reminders",      icon: Bell },
  { href: "/crisis",                   label: "Crisis support", icon: LifeBuoy },
  { href: "/dashboard/profile",        label: "Profile",        icon: User },
  { href: "/dashboard/settings",       label: "Settings",       icon: Settings },
];

const PROVIDER_NAV: NavItem[] = [
  { href: "/dashboard/provider",         label: "Practice",       icon: Briefcase },
  { href: "/dashboard/provider/profile", label: "Public profile", icon: User },
  { href: "/crisis",                     label: "Crisis support", icon: LifeBuoy },
  { href: "/dashboard/settings",         label: "Settings",       icon: Settings },
];

function navForRole(role: Role): NavItem[] {
  return role === "psychiatrist" || role === "psychologist" ? PROVIDER_NAV : PATIENT_NAV;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<{ name?: string; email?: string; role?: Role }>({});
  const navItems = navForRole(user.role ?? "patient");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = jwtDecode<{ name?: string; email?: string; role?: Role }>(token);
      setUser(payload);
    } catch { /* ignore bad token */ }
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
            ? "linear-gradient(180deg, var(--gf-sidebar-dark-from) 0%, var(--gf-sidebar-dark-to) 100%)"
            : "linear-gradient(180deg, var(--gf-sidebar-light-from) 0%, var(--gf-sidebar-light-to) 100%)",
          borderRightColor: "var(--gf-border)",
          color: "var(--gf-text)",
        }}
        aria-label="Primary navigation"
      >
        {/* Brand + mobile close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--gf-accent) 0%, var(--gf-accent-mid) 55%, var(--gf-accent-deep) 100%)",
                color: "var(--gf-btn-primary-text)",
                boxShadow: `0 6px 18px rgba(var(--gf-accent-rgb), 0.45), 0 0 18px rgba(var(--gf-accent-rgb), 0.35), inset 0 0 0 1px rgba(var(--gf-accent-rgb), 0.55)`,
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
        <div className="px-5 pb-3">
          <div className="text-xs gf-muted uppercase tracking-wider">Welcome back</div>
          <div className="text-base font-semibold truncate">
            {user.name || user.email || "Friend"}
          </div>
        </div>

        {/* ── Colour theme swatches ──────────────────────────── */}
        <div className="px-5 pb-3">
          <div className="text-[10px] gf-muted uppercase tracking-wider mb-1.5">Theme</div>
          <div className="flex items-center gap-1.5">
            {COLOR_THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setColorTheme(t.id)}
                title={t.label}
                aria-label={t.label}
                className="relative h-5 w-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                style={{ background: t.accent }}
              >
                {colorTheme === t.id && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `0 0 0 2px var(--gf-text), 0 0 0 3.5px ${t.accent}`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Light / dark toggle */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleTheme}
            className="gf-btn gf-btn-ghost w-full !justify-start"
            aria-label="Toggle colour mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 overflow-y-auto px-3 gf-scroll">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: active
                        ? `linear-gradient(90deg, rgba(var(--gf-accent-rgb), 0.18) 0%, rgba(var(--gf-accent-2-rgb), 0.06) 100%)`
                        : "transparent",
                      color: active ? "var(--gf-accent)" : "inherit",
                      boxShadow: active
                        ? `inset 3px 0 0 0 var(--gf-accent), 0 0 18px -4px rgba(var(--gf-accent-2-rgb), 0.45)`
                        : "none",
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {active && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full"
                        style={{
                          background: "var(--gf-accent)",
                          boxShadow: "0 0 10px var(--gf-accent), 0 0 4px #ffffff",
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
