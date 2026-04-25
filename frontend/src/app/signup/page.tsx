"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2, Sparkles, Check } from "lucide-react";
import { registerUser } from "../actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If they're already signed in, send them straight to the dashboard.
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

  // Lightweight password-strength meter (length + variety).
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
    return { score, label: labels[score] ?? "" };
  }, [password]);

  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must contain a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the terms to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerUser({ name, email, password });
      if (user?.accessToken) {
        toast.success(`Welcome, ${user.name?.split(" ")[0] ?? "friend"}!`);
        localStorage.setItem("accessToken", user.accessToken);
        router.push("/dashboard");
      } else {
        toast.error("Account created, but no token returned. Please log in.");
        router.push("/login");
      }
    } catch (err: unknown) {
      const ax = err as {
        code?: string;
        message?: string;
        response?: { status?: number; data?: { message?: string | string[] } };
      };
      const status = ax?.response?.status;
      const raw = ax?.response?.data?.message;
      const message = Array.isArray(raw) ? raw.join(", ") : raw;

      if (!ax?.response) {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        toast.error(
          `Couldn't reach the API at ${apiBase}. Is the backend running?`,
        );
        console.error("Signup network error:", ax?.code, ax?.message);
      } else if (status === 409) {
        toast.error("An account with that email already exists.");
      } else if (status === 400 && message) {
        toast.error(message);
      } else if (status === 429) {
        toast.error("Too many sign-up attempts. Try again in a minute.");
      } else if (status && status >= 500) {
        toast.error(
          `Server error (${status}). Check the backend logs — most likely DB or JWT_SECRET misconfigured.`,
        );
      } else {
        toast.error(message || `Something went wrong (${status ?? "?"}).`);
      }
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
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full"
        style={{ background: "rgba(72,255,187,0.15)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full"
        style={{ background: "rgba(80,255,200,0.12)", filter: "blur(140px)" }}
      />

      <Link
        href="/"
        className="absolute left-4 top-4 sm:left-6 sm:top-6 text-sm font-medium text-[#c7ffdc]/80 hover:text-[#c7ffdc] transition-colors"
      >
        ← Back to home
      </Link>

      <div
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl grid grid-cols-1 md:grid-cols-2"
        style={{
          background: "rgba(10, 45, 30, 0.85)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
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
            Begin your journey
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#9df2c8]/90">
            A quiet corner for daily growth — habits, journaling, and gentle
            check-ins on how you&apos;re really doing.
          </p>

          <ul className="mt-7 space-y-3 text-left text-sm text-[#c7ffdc]/85 max-w-xs w-full">
            {[
              "Track habits without the streak guilt",
              "Reflect with an AI-assisted journal",
              "See your week at a glance",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(31,191,117,0.18)" }}
                >
                  <Check size={12} className="text-[#7df3be]" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
            <Sparkles size={14} />
            Grow within, flow beyond.
          </div>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-14">
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#9df2c8]">
            It only takes a minute. No spam, ever.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9df2c8] mb-1.5"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                required
                minLength={2}
                maxLength={80}
                className="w-full rounded-xl border border-white/10 bg-[rgba(4,30,20,0.85)] px-4 py-3 text-[#d6ffec] placeholder-[#9df2c8]/40 outline-none transition-all focus:border-[#60d394] focus:ring-2 focus:ring-[#60d394]/40"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9df2c8] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars, with a letter & number"
                  required
                  minLength={8}
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

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-colors"
                        style={{
                          background:
                            i < strength.score
                              ? strength.score <= 1
                                ? "#f87171"
                                : strength.score === 2
                                ? "#facc15"
                                : "#34d399"
                              : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-[#9df2c8]/70">{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9df2c8] mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={
                    "w-full rounded-xl border bg-[rgba(4,30,20,0.85)] px-4 py-3 pr-12 text-[#d6ffec] placeholder-[#9df2c8]/40 outline-none transition-all focus:ring-2 " +
                    (passwordsMatch
                      ? "border-white/10 focus:border-[#60d394] focus:ring-[#60d394]/40"
                      : "border-red-400/50 focus:border-red-400 focus:ring-red-400/30")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#60d394] hover:bg-white/5 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-1 text-[11px] text-red-300/90">
                  Passwords don&apos;t match yet.
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 text-sm text-[#9df2c8]/90 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-[rgba(4,30,20,0.85)] text-[#1fbf75] focus:ring-[#60d394]/40"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/about"
                  className="font-semibold text-[#7df3be] hover:text-[#c7ffdc] transition-colors"
                >
                  terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/about"
                  className="font-semibold text-[#7df3be] hover:text-[#c7ffdc] transition-colors"
                >
                  privacy policy
                </Link>
                .
              </span>
            </label>

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
                  Creating account…
                </>
              ) : (
                <>Create account</>
              )}
            </button>

            <p className="text-center text-sm text-[#9df2c8]/90">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#7df3be] hover:text-[#c7ffdc] transition-colors"
              >
                Log in
                  </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
