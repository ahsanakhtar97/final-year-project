"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already admin-authenticated, skip to admin
  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = jwtDecode<{ role?: string }>(token);
        if (payload.role === "admin") router.replace("/admin");
      }
    } catch { /* ignore */ }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.role !== "admin") {
        setError("This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      router.replace("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #060e0b 0%, #0a1a14 50%, #081510 100%)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6"
        style={{
          background: "rgba(15,36,31,0.95)",
          border: "1px solid rgba(110,255,196,0.18)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(110,255,196,0.05)",
        }}
      >
        {/* Logo */}
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{
              background: "linear-gradient(135deg,#6effc4 0%,#1fbf75 55%,#108a54 100%)",
              boxShadow: "0 8px 24px rgba(16,138,84,0.5), 0 0 24px rgba(110,255,196,0.3)",
            }}
          >
            <ShieldCheck size={26} style={{ color: "#052818" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Lora', serif", color: "#e7f7ee" }}
            >
              GrowFlow Admin
            </h1>
            <p style={{ color: "rgba(231,247,238,0.5)", fontSize: 13 }}>
              Platform administration portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgba(231,247,238,0.6)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@growflow.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "rgba(110,255,196,0.05)",
                border: "1.5px solid rgba(110,255,196,0.18)",
                color: "#e7f7ee",
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgba(231,247,238,0.6)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                style={{
                  background: "rgba(110,255,196,0.05)",
                  border: "1.5px solid rgba(110,255,196,0.18)",
                  color: "#e7f7ee",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "#6effc4" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(225,76,76,0.12)",
                border: "1px solid rgba(225,76,76,0.3)",
                color: "#ff9090",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#1fbf75,#108a54)",
              color: "#052818",
              boxShadow: loading ? "none" : "0 6px 20px rgba(16,138,84,0.4)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Signing in…</>
            ) : (
              "Sign in to Admin Portal"
            )}
          </button>
        </form>

        <p
          className="text-center text-xs"
          style={{ color: "rgba(231,247,238,0.3)" }}
        >
          Admin access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
