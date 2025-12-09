"use client";
import { useRouter } from "next/navigation";
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
  Heart
} from "lucide-react";
import { useTheme } from "@/app/dashboard/layout";

export default function Sidebar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState({ name: "", email: "" });

  function getToken() {
    return localStorage.getItem("accessToken");
  }
  function getpayload(token: string | null) {
    return token ? jwtDecode(token) : null;
  }

  useEffect(() => {
    const t = getToken();
    const pl = getpayload(t);
    setUser(prev => ({ ...prev, ...pl }));
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  // MATCH TO-DO GREENISH THEME
  const sidebarStyle: React.CSSProperties = {
  width: "220px",
  minHeight: "100vh",
  padding: "20px",
  background: theme === "dark"
    ? "#111"                       // DARK MODE FIX
    : "linear-gradient(180deg, #dff8e3, #bfe7c5)",
  color: theme === "dark" ? "#fff" : "#123716",
  transition: "all 0.3s ease",
  borderRight: theme === "dark" ? "1px solid #333" : "1px solid #aacfb3"
};


  return (
    <aside style={sidebarStyle}>
      <h2 style={styles.heading}>Welcome, {user.name}</h2>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        style={{
          width: "100%",
          padding: "10px",
          background: theme === "dark" ? "#243b30" : "#c9eecd",
          color: theme === "dark" ? "#e5f5ec" : "#123716",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 600,
        }}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>

      <ul style={styles.menu}>
        <li style={styles.menuItem}>
          <Link href="/dashboard" style={{ ...styles.linkStyle, color: "inherit" }}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
        </li>

        <li style={styles.menuItem}>
          <Link
            href="/dashboard/to-do"
            style={{ ...styles.linkStyle, color: "inherit" }}
          >
            <CheckSquare size={20} />
            <span>To Do List</span>
          </Link>
        </li>

        <li style={styles.menuItem}>
          <Link
            href="/dashboard/profile"
            style={{ ...styles.linkStyle, color: "inherit" }}
          >
            <User size={20} />
            <span>Profile</span>
          </Link>
        </li>

        <li style={styles.menuItem}>
          <Link
            href="/dashboard/habit-tracker"
            style={{ ...styles.linkStyle, color: "inherit" }}
          >
            <Heart size={20} />
            <span>Habit Tracker</span>
          </Link>
        </li>
      </ul>
      


      <div style={styles.menuItem}>
        <LogOut size={20} />
        <button
          style={{ ...styles.logoutBtnStyle, color: "inherit" }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

const styles = {
  heading: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "30px",
  },
  menu: { listStyle: "none", padding: 0, margin: 0 },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    cursor: "pointer",
  },
  linkStyle: {
    textDecoration: "none",
    display: "flex",
    gap: "10px",
  },
  logoutBtnStyle: {
    fontSize: "16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
};
