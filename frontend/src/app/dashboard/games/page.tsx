"use client";

import Link from "next/link";
import { Brain, Heart, Layers } from "lucide-react";

const GAMES = [
  {
    href: "/dashboard/games/memory",
    icon: Layers,
    title: "Memory Cards",
    description: "Flip wellness-themed cards to find matching pairs. Beat your best time and move count.",
    color: "rgba(110,255,196,0.18)",
    accent: "#6effc4",
    difficulty: "Easy",
  },
  {
    href: "/dashboard/games/gratitude-jar",
    icon: Heart,
    title: "Gratitude Jar",
    description: "Drop positive thoughts into a jar. Watch it fill up as your gratitude grows.",
    color: "rgba(255,160,180,0.18)",
    accent: "#ffb3c6",
    difficulty: "Relaxing",
  },
  {
    href: "/dashboard/games/word-association",
    icon: Brain,
    title: "Word Association",
    description: "Given an emotion, pick the words you associate with it. Builds emotional vocabulary.",
    color: "rgba(160,180,255,0.18)",
    accent: "#b3c6ff",
    difficulty: "Medium",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Mind Games</h1>
        <p className="gf-muted">Short cognitive exercises to sharpen focus and lift your mood.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(({ href, icon: Icon, title, description, color, accent, difficulty }) => (
          <Link
            key={href}
            href={href}
            className="gf-card gf-card-hover p-6 block space-y-4"
            style={{ borderTop: `3px solid ${accent}` }}
          >
            <div className="flex items-start justify-between">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: color }}
              >
                <Icon size={22} style={{ color: accent }} />
              </div>
              <span className="gf-chip text-[11px]" style={{ background: color, color: accent }}>
                {difficulty}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg">{title}</h2>
              <p className="gf-muted text-sm mt-1 leading-relaxed">{description}</p>
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: accent }}
            >
              Play now →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
