"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarDays,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/doctors", label: "Doctor Verification", icon: ShieldCheck },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<{ name?: string; email?: string }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth check on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setReady(true); return; }
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { router.replace("/admin/login"); return; }
      const payload = jwtDecode<{ role?: string; name?: string; email?: string }>(token);
      if (payload.role !== "admin") { router.replace("/admin/login"); return; }
      setAdmin({ name: payload.name, email: payload.email });
      setReady(true);
    } catch {
      router.replace("/admin/login");
    }
  }, [pathname, isLoginPage, router]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.replace("/admin/login");
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#060e0b" }}
      >
        <div className="text-center space-y-3">
          <div
            className="inline-flex w-12 h-12 rounded-xl items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)" }}
          >
            <Sparkles size={20} style={{ color: "#052818" }} />
          </div>
          <p style={{ color: "rgba(231,247,238,0.4)", fontSize: 13 }}>Loading admin portal…</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#070f0c", color: "#e7f7ee" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-60 flex flex-col shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "linear-gradient(180deg,#0b1d18 0%,#0a1914 100%)",
          borderRight: "1px solid rgba(110,255,196,0.10)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg,#6effc4 0%,#1fbf75 55%,#108a54 100%)",
                boxShadow: "0 4px 14px rgba(16,138,84,0.5)",
                color: "#052818",
              }}
            >
              <ShieldCheck size={17} />
            </div>
            <div>
              <div
                className="font-bold text-sm leading-none"
                style={{ fontFamily: "'Lora', serif", color: "#e7f7ee" }}
              >
                GrowFlow
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(110,255,196,0.6)" }}>
                Admin Portal
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Admin info */}
        <div
          className="mx-3 mb-4 p-3 rounded-xl"
          style={{ background: "rgba(110,255,196,0.06)", border: "1px solid rgba(110,255,196,0.1)" }}
        >
          <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(110,255,196,0.5)" }}>
            Logged in as
          </div>
          <div className="font-semibold text-sm truncate">{admin.name || "Admin"}</div>
          <div className="text-[11px] truncate" style={{ color: "rgba(231,247,238,0.4)" }}>
            {admin.email}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(110,255,196,0.12)" : "transparent",
                  color: active ? "#aef0c9" : "rgba(231,247,238,0.65)",
                  boxShadow: active ? "inset 3px 0 0 0 #6effc4" : "none",
                }}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} style={{ color: "#6effc4" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Back to app + Logout */}
        <div className="px-3 pb-5 pt-3 space-y-1 border-t" style={{ borderColor: "rgba(110,255,196,0.08)" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "rgba(231,247,238,0.5)" }}
          >
            <Sparkles size={17} />
            <span>Back to App</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-red-500/10"
            style={{ color: "#e14c4c" }}
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "rgba(110,255,196,0.10)", background: "#0b1d18" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span
            className="font-bold text-sm"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Admin Portal
          </span>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
