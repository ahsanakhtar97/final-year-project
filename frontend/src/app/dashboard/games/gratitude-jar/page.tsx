"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2, Plus } from "lucide-react";

interface Entry {
  id: number;
  text: string;
  color: string;
}

const COLORS = [
  "rgba(110,255,196,0.30)",
  "rgba(255,180,110,0.30)",
  "rgba(160,180,255,0.30)",
  "rgba(255,160,180,0.30)",
  "rgba(92,242,255,0.30)",
  "rgba(255,240,100,0.28)",
];

const PROMPTS = [
  "Something that made me smile today…",
  "A person I'm grateful for…",
  "A small win I had recently…",
  "Something I'm looking forward to…",
  "A moment of peace I felt…",
  "Something I'm proud of myself for…",
];

export default function GratitudeJar() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [dropping, setDropping] = useState(false);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const nextId = useRef(1);

  const fillPercent = Math.min(100, (entries.length / 10) * 100);

  function addEntry() {
    const text = input.trim();
    if (!text) return;
    setDropping(true);
    setTimeout(() => {
      setEntries((prev) => [
        { id: nextId.current++, text, color: COLORS[prev.length % COLORS.length] },
        ...prev,
      ]);
      setInput("");
      setDropping(false);
    }, 600);
  }

  function remove(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/games" className="gf-btn gf-btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>Gratitude Jar</h1>
          <p className="gf-muted text-xs">Fill your jar with positive thoughts</p>
        </div>
      </div>

      {/* Jar visual */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: 140, height: 180 }}>
          {/* Jar body */}
          <svg viewBox="0 0 140 180" width={140} height={180}>
            {/* Jar outline */}
            <path
              d="M30,30 L20,50 L15,160 Q15,170 25,170 L115,170 Q125,170 125,160 L120,50 L110,30 Z"
              fill="rgba(110,255,196,0.06)"
              stroke="rgba(110,255,196,0.4)"
              strokeWidth="2"
            />
            {/* Fill level */}
            <clipPath id="jar-clip">
              <path d="M30,30 L20,50 L15,160 Q15,170 25,170 L115,170 Q125,170 125,160 L120,50 L110,30 Z" />
            </clipPath>
            <rect
              x="0"
              y={170 - (140 * fillPercent) / 100}
              width="140"
              height={(140 * fillPercent) / 100}
              fill="rgba(110,255,196,0.20)"
              clipPath="url(#jar-clip)"
              style={{ transition: "y 0.6s ease, height 0.6s ease" }}
            />
            {/* Lid */}
            <rect x="25" y="20" width="90" height="16" rx="4"
              fill="rgba(110,255,196,0.15)" stroke="rgba(110,255,196,0.4)" strokeWidth="2" />
            {/* Shine */}
            <path d="M28,55 Q32,90 28,130" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>

          {/* Dropping animation */}
          {dropping && (
            <div
              className="absolute left-1/2 -translate-x-1/2 text-lg"
              style={{
                top: 0,
                animation: "drop 0.6s ease-in forwards",
              }}
            >
              💚
            </div>
          )}

          {/* Entry count */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: "#6effc4", marginTop: 20 }}>
              {entries.length}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drop {
          0% { top: -20px; opacity: 1; }
          100% { top: 120px; opacity: 0; }
        }
      `}</style>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="gf-card p-3 text-center text-sm" style={{ background: "rgba(110,255,196,0.08)" }}>
          {entries.length >= 10
            ? "🎉 Your jar is full! You're overflowing with gratitude."
            : `${entries.length} thought${entries.length !== 1 ? "s" : ""} in your jar · ${10 - entries.length} more to fill it`}
        </div>
      )}

      {/* Input */}
      <div className="gf-card p-5 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider opacity-80">
          {prompt}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addEntry(); } }}
          rows={3}
          placeholder="Type something you're grateful for…"
          className="gf-textarea"
        />
        <button
          onClick={addEntry}
          disabled={!input.trim() || dropping}
          className="gf-btn gf-btn-primary w-full"
        >
          <Plus size={14} /> Drop it in the jar
        </button>
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h2 className="gf-h2 flex items-center gap-2">
            <Heart size={16} style={{ color: "#ffb3c6" }} /> Your thoughts
          </h2>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="gf-card p-4 flex items-start gap-3"
              style={{ background: entry.color }}
            >
              <p className="flex-1 text-sm leading-relaxed">{entry.text}</p>
              <button
                onClick={() => remove(entry.id)}
                className="gf-btn gf-btn-ghost !p-1.5 shrink-0 opacity-50 hover:opacity-100"
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="gf-card p-8 text-center">
          <div className="text-4xl mb-3">🫙</div>
          <p className="gf-muted text-sm">Your jar is empty. Add your first grateful thought above.</p>
        </div>
      )}
    </div>
  );
}
