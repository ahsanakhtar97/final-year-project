"use client";

/**
 * Custom 404. Plays the same visual language as the rest of GrowFlow.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { Compass, Home, ArrowLeft } from "lucide-react";

const AmbientScene = dynamic(
  () => import("./components/ambient-scene"),
  { ssr: false, loading: () => null },
);

export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#eafff0,#cdecd4)",
        color: "#123716",
      }}
    >
      {/* 3D ambient scene -- wireframe icosahedron, off-track / lost feel. */}
      <AmbientScene variant="wire" mode="light" intensity={0.6} position="hero" />

      <div className="relative z-10 text-center max-w-md">
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
