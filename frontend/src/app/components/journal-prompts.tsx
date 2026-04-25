"use client";

/**
 * Journal prompts library.
 *
 * A pop-out drawer of curated prompts, grouped by intent. The user can pick
 * one to seed the textarea on the journal page. We expose this as a
 * controlled component so the journal page can manage open state and the
 * onPick callback decides what to do with the prompt text.
 */

import React, { useMemo, useState } from "react";
import { X, Search, Shuffle } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";

interface PromptGroup {
  category: string;
  prompts: string[];
}

const LIBRARY: PromptGroup[] = [
  {
    category: "Reflection",
    prompts: [
      "What did today teach me about myself?",
      "Three small wins I had today, however tiny.",
      "What drained me, and what filled me up?",
      "If today were a chapter title, what would it be?",
    ],
  },
  {
    category: "Gratitude",
    prompts: [
      "Three things I'm grateful for right now -- and why.",
      "Someone who helped me lately, and the moment that meant the most.",
      "A small comfort I might have taken for granted today.",
      "Something I'm looking forward to this week.",
    ],
  },
  {
    category: "Stuck",
    prompts: [
      "What's one thing I've been avoiding, and what's the smallest first step?",
      "If a friend were stuck on this, what would I tell them?",
      "What am I making this mean that might not be true?",
      "What would 'good enough' look like today?",
    ],
  },
  {
    category: "Direction",
    prompts: [
      "Where do I want to be in 12 weeks, and what would I need to start now?",
      "Which of my habits is paying off, and which one isn't anymore?",
      "What recently surprised me about my own preferences?",
      "Which 'should' am I ready to drop?",
    ],
  },
  {
    category: "Letting go",
    prompts: [
      "Something I'm carrying that I don't need to bring into tomorrow.",
      "A grudge or worry I'd like to set down -- written out in full.",
      "What does forgiving past-me look like today?",
      "If today were a slow exhale, what would I let go of with it?",
    ],
  },
  {
    category: "Energy",
    prompts: [
      "When did I feel most awake today, and what was happening?",
      "What kind of work makes time disappear for me?",
      "What I ate / drank / how I slept -- and how my body feels right now.",
      "What's the next 25-minute block I can make sacred?",
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (prompt: string) => void;
}

export default function JournalPrompts({ open, onClose, onPick }: Props) {
  const { primaryAccent, isDark } = useTheme();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return LIBRARY;
    return LIBRARY.map((g) => ({
      ...g,
      prompts: g.prompts.filter((p) => p.toLowerCase().includes(needle)),
    })).filter((g) => g.prompts.length > 0);
  }, [q]);

  function pickRandom() {
    const all = LIBRARY.flatMap((g) => g.prompts);
    const pick = all[Math.floor(Math.random() * all.length)];
    onPick(pick);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="gf-card w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "85vh", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{
            borderBottomColor: isDark
              ? "rgba(174,240,201,0.10)"
              : "rgba(22,59,37,0.10)",
          }}
        >
          <Search size={16} style={{ color: primaryAccent }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts…"
            className="flex-1 bg-transparent outline-none text-sm py-1"
          />
          <button
            type="button"
            className="gf-btn gf-btn-ghost !p-1.5"
            onClick={pickRandom}
            title="Surprise me"
          >
            <Shuffle size={14} />
          </button>
          <button
            type="button"
            className="gf-btn gf-btn-ghost !p-1.5"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto gf-scroll p-4">
          {filtered.length === 0 ? (
            <p className="gf-muted text-sm text-center py-6">
              No prompts match.
            </p>
          ) : (
            filtered.map((g) => (
              <div key={g.category} className="mb-5">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: primaryAccent }}
                >
                  {g.category}
                </div>
                <ul className="space-y-1.5">
                  {g.prompts.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => {
                          onPick(p);
                          onClose();
                        }}
                        className="w-full text-left text-sm p-2.5 rounded-lg transition-all"
                        style={{
                          background: isDark
                            ? "rgba(174,240,201,0.04)"
                            : "rgba(22,59,37,0.04)",
                        }}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
