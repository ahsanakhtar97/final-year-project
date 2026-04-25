"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { loginUser } from "../actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const decoded: { exp: number } = jwtDecode(token);
      if (decoded.exp > Date.now() / 1000) {
        router.push("/dashboard");
      } else {
        localStorage.removeItem("accessToken");
      }
    } catch {
      localStorage.removeItem("accessToken");
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const user = await loginUser({ email, password });
      if (user?.accessToken) {
        toast.success("Welcome back! 🌿");
        localStorage.setItem("accessToken", user.accessToken);
        router.push("/dashboard");
      } else {
        toast.error("Invalid credentials or server error.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-10 sm:py-16"
      style={{
        background:
          "linear-gradient(135deg,#021a10 0%,#06361f 55%,#0c4a2a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(72,255,187,0.15)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(80,255,200,0.12)",
          filter: "blur(140px)",
        }}
      />

      {/* back to home */}
      <Link
        href="/"
        className="absolute left-4 top-4 sm:left-6 sm:top-6 text-sm font-medium text-[#c7ffdc]/80 hover:text-[#c7ffdc] transition-colors"
      >
        ← Back to home
      </Link>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl grid grid-cols-1 md:grid-cols-2"
        style={{
          background: "rgba(10, 45, 30, 0.85)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {/* Left — brand panel (hidden on xs) */}
        <div
          className="hidden md:flex flex-col items-center justify-center p-10 text-center border-r border-white/5"
          style={{ background: "rgba(6, 25, 18, 0.85)" }}
        >
          <div className="w-48 aspect-square relative mb-6">
            <Image
              src="/logo3.png"
              alt="GrowFlow Logo"
              fill
              className="object-contain drop-shadow-[0_10px_30px_rgba(31,191,117,0.35)]"
              priority
            />
          </div>
          <h2
            className="text-3xl font-bold text-[#c7ffdc] tracking-tight"
            style={{ fontFamily: "'Lora', serif" }}
          >
            GrowFlow
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#9df2c8]/90">
            Self-development & mental wellness — a quiet corner for your daily
            growth.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
            <Sparkles size={14} />
            Grow within, flow beyond.
          </div>
        </div>

        {/* Right — form */}
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-12 h-12 relative">
              <Image src="/logo3.png" alt="GrowFlow" fill className="object-contain" />
            </div>
            <span
              className="text-xl font-bold text-[#c7ffdc]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              GrowFlow
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-[#c7ffdc]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#9df2c8]">
            Log in to continue your journey 🌿
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9df2c8] mb-1.5"
              >
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-[rgba(4,30,20,0.85)] px-4 py-3 text-[#d6ffec] placeholder-[#9df2c8]/40 outline-none transition-all focus:border-[#60d394] focus:ring-2 focus:ring-[#60d394]/40"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9df2c8] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[rgba(4,30,20,0.85)] px-4 py-3 pr-12 text-[#d6ffec] placeholder-[#9df2c8]/40 outline-none transition-all focus:border-[#60d394] focus:ring-2 focus:ring-[#60d394]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#60d394] hover:bg-white/5 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#7df3be] hover:text-[#c7ffdc] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-[#052818] transition-all hover:shadow-[0_14px_32px_rgba(31,191,117,0.45)] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(145deg,#1fbf75,#108a54)",
                boxShadow: "0 8px 22px rgba(31,191,117,0.35)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Log in</>
              )}
            </button>

            <p className="text-center text-sm text-[#9df2c8]/90">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#7df3be] hover:text-[#c7ffdc] transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
