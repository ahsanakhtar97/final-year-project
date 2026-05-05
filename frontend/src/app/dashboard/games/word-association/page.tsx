"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";

interface Round {
  emotion: string;
  emotionColor: string;
  words: string[];
  correct: string[];
  reflection: string;
}

const ROUNDS: Round[] = [
  {
    emotion: "Anxious",
    emotionColor: "rgba(255,180,80,0.25)",
    words: ["Racing thoughts", "Calm", "Tight chest", "Grounded", "Worried", "Peaceful", "Restless", "Present"],
    correct: ["Racing thoughts", "Tight chest", "Worried", "Restless"],
    reflection: "Noticing anxiety is the first step. Try slowing your breath — 4 counts in, 6 counts out.",
  },
  {
    emotion: "Grateful",
    emotionColor: "rgba(110,255,196,0.25)",
    words: ["Warmth", "Empty", "Appreciated", "Isolated", "Thankful", "Connected", "Bitter", "Abundance"],
    correct: ["Warmth", "Appreciated", "Thankful", "Connected", "Abundance"],
    reflection: "Gratitude rewires the brain toward positivity over time. You're building something real.",
  },
  {
    emotion: "Overwhelmed",
    emotionColor: "rgba(160,130,255,0.25)",
    words: ["Too much", "Spacious", "Frozen", "Clarity", "Scattered", "Focused", "Drowning", "Light"],
    correct: ["Too much", "Frozen", "Scattered", "Drowning"],
    reflection: "When everything feels like too much, pick just one small thing. One step is enough.",
  },
  {
    emotion: "Hopeful",
    emotionColor: "rgba(92,220,255,0.25)",
    words: ["Possibility", "Stuck", "Forward", "Dread", "Open", "Trapped", "Anticipation", "Growing"],
    correct: ["Possibility", "Forward", "Open", "Anticipation", "Growing"],
    reflection: "Hope is a practice. Each time you choose to look forward, you strengthen that muscle.",
  },
  {
    emotion: "Sad",
    emotionColor: "rgba(140,160,220,0.25)",
    words: ["Heavy", "Bright", "Withdrawn", "Energised", "Tearful", "Numb", "Light", "Hollow"],
    correct: ["Heavy", "Withdrawn", "Tearful", "Numb", "Hollow"],
    reflection: "Sadness deserves space, not suppression. Sitting with it, even briefly, helps it move through.",
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Phase = "playing" | "result";

export default function WordAssociation() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("playing");
  const [score, setScore] = useState(0);
  const [shuffledWords] = useState(() => ROUNDS.map((r) => shuffle(r.words)));
  const [finished, setFinished] = useState(false);

  const round = ROUNDS[roundIndex];
  const words = shuffledWords[roundIndex];

  function toggle(word: string) {
    if (phase !== "playing") return;
    setSelected((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }

  function submit() {
    const correct = round.correct;
    const hits = selected.filter((w) => correct.includes(w)).length;
    const perfect = hits === correct.length && selected.length === correct.length;
    if (perfect) setScore((s) => s + 1);
    setPhase("result");
  }

  function next() {
    if (roundIndex + 1 >= ROUNDS.length) {
      setFinished(true);
    } else {
      setRoundIndex((i) => i + 1);
      setSelected([]);
      setPhase("playing");
    }
  }

  function restart() {
    setRoundIndex(0);
    setSelected([]);
    setPhase("playing");
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/games" className="gf-btn gf-btn-ghost !p-2">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>Word Association</h1>
        </div>
        <div className="gf-card p-8 text-center space-y-4">
          <div className="text-5xl">{score === ROUNDS.length ? "🏆" : score >= 3 ? "🌟" : "💚"}</div>
          <h2 className="gf-h2">Session complete!</h2>
          <p className="gf-muted">You got {score} out of {ROUNDS.length} rounds perfectly.</p>
          <p className="text-sm leading-relaxed opacity-80 max-w-sm mx-auto">
            {score === ROUNDS.length
              ? "Perfect score! Your emotional awareness is sharp."
              : "Each round builds your emotional vocabulary. Keep practising."}
          </p>
          <button onClick={restart} className="gf-btn gf-btn-primary mt-2">
            <RotateCcw size={14} /> Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/games" className="gf-btn gf-btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>Word Association</h1>
          <p className="gf-muted text-xs">Round {roundIndex + 1} of {ROUNDS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full" style={{ background: "rgba(110,255,196,0.12)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((roundIndex) / ROUNDS.length) * 100}%`,
            background: "linear-gradient(90deg,#6effc4,#5cf2ff)",
          }}
        />
      </div>

      {/* Emotion card */}
      <div
        className="gf-card p-6 text-center"
        style={{ background: round.emotionColor }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
          This emotion is…
        </p>
        <h2 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
          {round.emotion}
        </h2>
        <p className="gf-muted text-sm mt-2">
          {phase === "playing"
            ? "Select all words you associate with this feeling."
            : "Here's how you did."}
        </p>
      </div>

      {/* Word grid */}
      <div className="grid grid-cols-2 gap-2">
        {words.map((word) => {
          const isSelected = selected.includes(word);
          const isCorrect = round.correct.includes(word);
          let bg = isSelected ? "rgba(110,255,196,0.18)" : "rgba(110,255,196,0.05)";
          let border = isSelected ? "#6effc4" : "rgba(110,255,196,0.15)";
          if (phase === "result") {
            if (isCorrect) { bg = "rgba(110,255,196,0.25)"; border = "#6effc4"; }
            else if (isSelected && !isCorrect) { bg = "rgba(225,76,76,0.18)"; border = "#e14c4c"; }
          }
          return (
            <button
              key={word}
              onClick={() => toggle(word)}
              disabled={phase === "result"}
              className="p-3 rounded-xl text-sm font-medium text-left transition-all"
              style={{ background: bg, border: `1.5px solid ${border}` }}
            >
              {phase === "result" && isCorrect && "✓ "}
              {phase === "result" && isSelected && !isCorrect && "✗ "}
              {word}
            </button>
          );
        })}
      </div>

      {/* Reflection */}
      {phase === "result" && (
        <div
          className="gf-card p-5 space-y-1"
          style={{ background: "rgba(110,255,196,0.08)", borderLeft: "3px solid #6effc4" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Reflection</p>
          <p className="text-sm leading-relaxed">{round.reflection}</p>
        </div>
      )}

      {/* Action button */}
      {phase === "playing" ? (
        <button
          onClick={submit}
          disabled={selected.length === 0}
          className="gf-btn gf-btn-primary w-full"
        >
          Submit
        </button>
      ) : (
        <button onClick={next} className="gf-btn gf-btn-primary w-full">
          {roundIndex + 1 >= ROUNDS.length ? "See results" : "Next round"}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
