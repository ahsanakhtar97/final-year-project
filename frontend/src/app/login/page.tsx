"use client";

import React, { useEffect, useState } from "react";
import { loginUser } from "../actions/auth";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded: { exp: number } = jwtDecode(token);
      if (decoded.exp > Date.now() / 1000) {
        router.push("/dashboard");
      } else {
        localStorage.removeItem("accessToken");
      }
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const user = await loginUser({ email, password });

    if (user?.accessToken) {
      toast.success("Login Successful");
      localStorage.setItem("accessToken", user.accessToken);
      router.push("/dashboard");
    }
  }

  return (
    <div style={styles.container}>
      <ToastContainer />

      {/* Glow Background */}
      <div style={styles.glowTop}></div>
      <div style={styles.glowBottom}></div>

      {/* Main Card */}
      <div style={styles.card}>
        {/* Left Panel */}
        <div style={styles.leftPanel}>
          <img src="/logo3.png" style={{ width: 150, marginBottom: 16 }} />
          <h2 style={{ color: "#c7ffdc" }}>GrowFlow</h2>
          <p style={{ color: "#9df2c8" }}>Self-development & Mental Health</p>
        </div>

        {/* Right Panel */}
        <div style={styles.rightPanel}>
          <h1 style={styles.heading}>Welcome Back</h1>
          <p style={styles.subtext}>Log in to continue your journey 🌿</p>

          <form onSubmit={handleLogin} style={{ marginTop: 30 }}>
            <input
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />

            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />

            <div onClick={() => setShowPass(!showPass)} style={styles.toggle}>
              {showPass ? "Hide password" : "Show password"}
            </div>

            <button type="submit" style={styles.button}>
              Log In
            </button>

            {/* Forgot Password */}
            <p
              style={styles.forgot}
              onClick={() => alert("Reset feature coming soon!")}
            >
              Forgot password?
            </p>

            {/* ⭐ NEW: SIGN UP REDIRECT ⭐ */}
            {/* ⭐ NEW: SIGN UP REDIRECT ⭐ */}
<div style={{ marginTop: 25, textAlign: "center" }}>
  <p style={{ color: "#b4ffe0", fontSize: "0.95rem" }}>
    Don’t have an account?{" "}
    <span
      onClick={() => router.push("/register")}
      style={{
        textDecoration: "underline",
        cursor: "pointer",
        fontWeight: 600,
        color: "#d6ffe8",
      }}
    >
      Create one
    </span>
  </p>
</div>

          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #021a10, #06361f, #0c4a2a)",
    fontFamily: "'Lora','Georgia', serif",
  },
  glowTop: {
    position: "absolute",
    width: 500,
    height: 500,
    background: "rgba(72,255,187,0.15)",
    filter: "blur(140px)",
    top: -200,
    left: -200,
  },
  glowBottom: {
    position: "absolute",
    width: 500,
    height: 500,
    background: "rgba(80,255,200,0.12)",
    filter: "blur(140px)",
    bottom: -200,
    right: -200,
  },
  card: {
    width: "92%",
    maxWidth: 900,
    minHeight: 520,
    display: "flex",
    borderRadius: 26,
    background: "rgba(10, 45, 30, 0.94)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    overflow: "hidden",
    zIndex: 2,
  },
  leftPanel: {
    flex: 1,
    background: "rgba(6, 25, 18, 0.85)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    borderRight: "1px solid rgba(255,255,255,0.03)",
  },
  rightPanel: {
    flex: 1,
    padding: "60px 50px",
  },
  heading: {
    fontSize: "2.4rem",
    color: "#c7ffdc",
    marginBottom: 8,
  },
  subtext: {
    color: "#9df2c8",
    fontSize: "1.05rem",
  },
  toggle: {
    marginTop: 12,
    color: "#9affd4",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  forgot: {
    marginTop: 18,
    color: "#7df3be",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
  button: {
    marginTop: 26,
    width: "100%",
    padding: "16px",
    background: "linear-gradient(145deg,#1fbf75,#108a54)",
    borderRadius: 15,
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#012016",
    border: "none",
    cursor: "pointer",
    boxShadow: "0px 12px 30px rgba(0,0,0,0.5)",
  },

  /* ⭐ New Create Account Button ⭐ */
  createBtn: {
    padding: "12px 20px",
    background: "rgba(160,255,200,0.2)",
    borderRadius: 12,
    color: "#b4ffe0",
    border: "1px solid rgba(160,255,200,0.3)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "1rem",
    transition: "0.3s ease",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  marginBottom: 16,
  borderRadius: 14,
  border: "1px solid rgba(160,255,200,0.15)",
  fontSize: "1.05rem",
  outline: "none",
  background: "rgba(4, 30, 20, 0.85)",
  color: "#d6ffec",
};
