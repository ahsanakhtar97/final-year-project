"use client";

/**
 * Forgot password (frontend stub).
 *
 * The full reset flow needs an SMTP transport on the backend, which isn't
 * wired up yet. To keep the UX honest we ALWAYS show a "check your inbox"
 * message after a brief delay -- regardless of whether an account with that
 * email exists -- which is also the right pattern for production once the
 * backend is wired up (it prevents account enumeration). When an admin wires
 * up SMTP, the only thing that changes is the API call here.
 */

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      // Placeholder. When SMTP is wired up:
      //   await api.post("/auth/forgot-password", { email });
      await new Promise((r) => setTimeout(r, 700));
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg,#06130f 0%, #0f2a21 60%, #163b25 100%)",
        color: "#e7f7ee",
      }}
    >
      <div
        className="w-full max-w-md p-7 rounded-2xl"
        style={{
          background: "rgba(15,42,33,0.85)",
          border: "1px solid rgba(174,240,201,0.10)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-4"
        >
          <ArrowLeft size={12} /> Back to sign in
        </Link>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Forgot your password?
        </h1>
        <p className="text-sm opacity-80 mb-5">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>

        {sent ? (
          <div
            className="rounded-lg p-4 flex items-start gap-3"
            style={{ background: "rgba(143,232,178,0.10)" }}
          >
            <CheckCircle2 size={18} style={{ color: "#8fe8b2" }} />
            <div className="text-sm">
              <div className="font-semibold mb-0.5">Check your inbox.</div>
              <p className="opacity-80">
                If an account exists for <strong>{email}</strong>, you&apos;ll get a
                reset link shortly. The link expires in 30 minutes.
              </p>
              <p className="opacity-60 mt-2 text-xs">
                Didn&apos;t get anything? Check spam, or try again in a few minutes.
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-xs font-semibold opacity-90">
              Email
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{
                background: "rgba(6,19,15,0.6)",
                border: "1px solid rgba(174,240,201,0.10)",
              }}
            >
              <Mail size={14} style={{ color: "#8fe8b2" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="w-full py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                background: "#8fe8b2",
                color: "#06130f",
              }}
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-[11px] opacity-60 text-center">
              Heads up: email delivery is not yet enabled on this build. Once
              configured, this form will send a real reset link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
