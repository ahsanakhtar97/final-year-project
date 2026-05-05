"use client";

import Link from "next/link";
import { Brain, Heart, Layers, Wind, Bomb, Palette, Sparkles } from "lucide-react";

const GAMES = [
  {
    href: "/dashboard/games/memory",
    icon: Layers,
    title: "Memory Cards",
    description: "Flip wellness-themed cards to find matching pairs. Beat your best time and move count.",
    color: "rgba(110,255,196,0.18)",
    accent: "#6effc4",
    difficulty: "Easy",
    emoji: "🃏",
  },
  {
    href: "/dashboard/games/gratitude-jar",
    icon: Heart,
    title: "Gratitude Jar",
    description: "Drop positive thoughts into a jar. Watch it fill up as your gratitude grows.",
    color: "rgba(255,160,180,0.18)",
    accent: "#ffb3c6",
    difficulty: "Relaxing",
    emoji: "🫙",
  },
  {
    href: "/dashboard/games/word-association",
    icon: Brain,
    title: "Word Association",
    description: "Given an emotion, pick the words you associate with it. Builds emotional vocabulary.",
    color: "rgba(160,180,255,0.18)",
    accent: "#b3c6ff",
    difficulty: "Medium",
    emoji: "💬",
  },
  {
    href: "/dashboard/games/breathing",
    icon: Wind,
    title: "Breathing Bubble",
    description: "Follow the expanding bubble for box breathing — 4 seconds each phase. Instantly calming.",
    color: "rgba(96,165,250,0.18)",
    accent: "#60a5fa",
    difficulty: "Calming",
    emoji: "🫧",
  },
  {
    href: "/dashboard/games/bubble-pop",
    icon: Bomb,
    title: "Bubble Pop",
    description: "Worry bubbles are floating away — smash them before they escape! Lives, levels, and speed.",
    color: "rgba(248,113,113,0.18)",
    accent: "#f87171",
    difficulty: "Fast-paced",
    emoji: "💥",
  },
  {
    href: "/dashboard/games/stroop",
    icon: Palette,
    title: "Colour Challenge",
    description: "Tap the colour the word is WRITTEN IN, not what it says. Classic Stroop test. 60 seconds.",
    color: "rgba(192,132,252,0.18)",
    accent: "#c084fc",
    difficulty: "Hard",
    emoji: "🎨",
  },
  {
    href: "/dashboard/games/affirmations",
    icon: Sparkles,
    title: "Affirmation Scramble",
    description: "Reassemble scrambled positive affirmations word by word. Build your inner voice.",
    color: "rgba(251,191,36,0.18)",
    accent: "#fbbf24",
    difficulty: "Mindful",
    emoji: "✨",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Mind Games</h1>
        <p className="gf-muted">Short cognitive exercises to sharpen focus, lift your mood, and build resilience.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GAMES.map(({ href, icon: Icon, title, description, color, accent, difficulty, emoji }) => (
          <Link
            key={href}
            href={href}
            className="gf-card gf-card-hover p-6 block space-y-4"
            style={{ borderTop: `3px solid ${accent}` }}
          >
            <div className="flex items-start justify-between">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: color }}
              >
                {emoji}
              </div>
              <span className="gf-chip text-[11px]" style={{ background: color, color: accent }}>
                {difficulty}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg">{title}</h2>
              <p className="gf-muted text-sm mt-1 leading-relaxed">{description}</p>
            </div>
            <div className="text-sm font-semibold" style={{ color: accent }}>
              Play now →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
