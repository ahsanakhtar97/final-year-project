"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trophy, Clock, Hash } from "lucide-react";

const EMOJIS = ["🌿", "🌸", "🦋", "🌊", "☀️", "🌙", "🍃", "🌺"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeCards(): Card[] {
  return shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(makeCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  // Timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // Check win
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setRunning(false);
      setWon(true);
      setBestTime((prev) => (prev === null || seconds < prev ? seconds : prev));
      setBestMoves((prev) => (prev === null || moves < prev ? moves : prev));
    }
  }, [cards, seconds, moves]);

  const flip = useCallback((id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (!running && !won) setRunning(true);

    const next = selected.length === 0 ? [id] : [...selected, id];
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    );

    if (next.length === 2) {
      setMoves((m) => m + 1);
      setSelected([]);
      const [a, b] = next.map((i) => cards.find((c) => c.id === i)!);
      if (a.emoji === b.emoji) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === next[0] || c.id === next[1] ? { ...c, matched: true } : c
          )
        );
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === next[0] || c.id === next[1] ? { ...c, flipped: false } : c
            )
          );
          setLocked(false);
        }, 900);
      }
    } else {
      setSelected(next);
    }
  }, [cards, selected, locked, running, won]);

  function reset() {
    setCards(makeCards());
    setSelected([]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setWon(false);
    setLocked(false);
  }

  const matched = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/games" className="gf-btn gf-btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>Memory Cards</h1>
          <p className="gf-muted text-xs">Match all pairs to win</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: "Time", value: formatTime(seconds) },
          { icon: Hash, label: "Moves", value: moves },
          { icon: Trophy, label: "Pairs", value: `${matched}/${EMOJIS.length}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="gf-card p-3 text-center">
            <Icon size={14} className="mx-auto mb-1 opacity-60" />
            <div className="font-bold text-lg">{value}</div>
            <div className="text-xs gf-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Best scores */}
      {(bestTime !== null || bestMoves !== null) && (
        <div className="gf-card p-3 flex gap-4 text-sm" style={{ background: "rgba(110,255,196,0.08)" }}>
          <Trophy size={14} className="mt-0.5 shrink-0" style={{ color: "#6effc4" }} />
          <span>Best: {bestTime !== null ? formatTime(bestTime) : "—"} · {bestMoves ?? "—"} moves</span>
        </div>
      )}

      {/* Win banner */}
      {won && (
        <div
          className="gf-card p-5 text-center space-y-2"
          style={{ background: "rgba(110,255,196,0.15)", borderColor: "#6effc4" }}
        >
          <div className="text-3xl">🎉</div>
          <div className="font-bold text-lg">You matched all pairs!</div>
          <p className="gf-muted text-sm">{formatTime(seconds)} · {moves} moves</p>
          <button onClick={reset} className="gf-btn gf-btn-primary mt-2">
            <RotateCcw size={14} /> Play again
          </button>
        </div>
      )}

      {/* Grid */}
      {!won && (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className="aspect-square rounded-xl text-3xl flex items-center justify-center transition-all duration-300 font-bold"
              style={{
                background: card.flipped || card.matched
                  ? card.matched
                    ? "rgba(110,255,196,0.25)"
                    : "rgba(110,255,196,0.12)"
                  : "rgba(110,255,196,0.07)",
                border: `2px solid ${card.matched ? "#6effc4" : card.flipped ? "rgba(110,255,196,0.4)" : "rgba(110,255,196,0.1)"}`,
                transform: card.flipped || card.matched ? "rotateY(0deg)" : "rotateY(90deg)",
                cursor: card.matched ? "default" : "pointer",
                boxShadow: card.matched ? "0 0 12px rgba(110,255,196,0.3)" : "none",
              }}
            >
              {card.flipped || card.matched ? card.emoji : ""}
            </button>
          ))}
        </div>
      )}

      <button onClick={reset} className="gf-btn gf-btn-ghost w-full">
        <RotateCcw size={14} /> New game
      </button>
    </div>
  );
}
