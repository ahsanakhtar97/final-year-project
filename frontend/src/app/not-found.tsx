"use client";

/**
 * Custom 404. Plays the same visual language as the rest of GrowFlow.
 */

import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(180deg,#eafff0,#cdecd4)",
        color: "#123716",
      }}
    >
      <div className="text-center max-w-md">
        <div
          className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "#163b25", color: "#ffffff" }}
        >
          <Compass size={28} />
        </div>
        <h1
          className="text-5xl font-bold mb-2"
          style={{ fontFamily: "'Lora', serif", color: "#163b25" }}
        >
          404
        </h1>
        <p className="text-lg mb-1" style={{ color: "#163b25" }}>
          Looks like you&apos;ve wandered off the path.
        </p>
        <p className="text-sm mb-6" style={{ color: "#5d7a66" }}>
          The page you were after isn&apos;t here. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/dashboard"
            className="gf-btn gf-btn-primary"
          >
            <Home size={14} /> Dashboard
          </Link>
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    </div>
  );
}
