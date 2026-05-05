"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COLORS = [
  { name: "Red",    hex: "#f87171" },
  { name: "Blue",   hex: "#60a5fa" },
  { name: "Green",  hex: "#34d399" },
  { name: "Yellow", hex: "#fbbf24" },
  { name: "Purple", hex: "#c084fc" },
  { name: "Orange", hex: "#fb923c" },
];

interface Round {
  word:      string; // the text shown
  textColor: string; // the colour it's displayed in
  answer:    string; // correct button to press (the hex of textColor)
}

function makeRound(): Round {
  const wordColor  = COLORS[Math.floor(Math.random() * COLORS.length)];
  let   textColor  = COLORS[Math.floor(Math.random() * COLORS.length)];
  // ensure mismatch most of the time for challenge
  if (Math.random() > 0.2) {
    while (textColor.name === wordColor.name) {
      textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
  }
  return { word: wordColor.name, textColor: textColor.hex, answer: textColor.hex };
}

const TOTAL_TIME = 60;

export default function StroopPage() {
  const [round, setRound]       = useState<Round>(makeRound());
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [best, setBest]         = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [flash, setFlash]       = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endGame = useCallback(() => {
    setRunning(false);
    setDone(true);
    setBest(b => Math.max(b, score));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [score]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, endGame]);

  const answer = (hex: string) => {
    if (!running) return;
    const correct = hex === round.answer;
    setFlash(correct ? "correct" : "wrong");
    setTimeout(() => setFlash(null), 280);
    if (correct) {
      setScore(s => s + 1 + Math.floor(streak / 3));
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    setRound(makeRound());
  };

  const start = () => {
    setRound(makeRound());
    setScore(0);
    setStreak(0);
    setTimeLeft(TOTAL_TIME);
    setDone(false);
    setRunning(true);
  };

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 20 ? "#6effc4" : timeLeft > 10 ? "#fbbf24" : "#f87171";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Colour Challenge</h1>
        <p className="gf-muted">Tap the colour the word is <em>written in</em> — not what it says. Classic Stroop test.</p>
      </header>

      {/* Stats bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Score</span>
          <span className="text-xl font-bold" style={{ color: "#6effc4" }}>{score}</span>
        </div>
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Streak</span>
          <span className="text-xl font-bold" style={{ color: "#fbbf24" }}>🔥{streak}</span>
        </div>
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Best</span>
          <span className="text-xl font-bold" style={{ color: "#c084fc" }}>{best}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="gf-card p-4">
        <div className="flex justify-between text-xs gf-muted mb-2">
          <span>Time remaining</span>
          <span className="font-bold" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>
      </div>

      {/* Main card */}
      <div
        className="gf-card p-8 flex flex-col items-center gap-8"
        style={{
          borderColor: flash === "correct" ? "#6effc4" : flash === "wrong" ? "#f87171" : undefined,
          borderWidth: flash ? 2 : 1,
          transition: "border-color 0.15s",
        }}
      >
        {!running && !done && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">🎨</div>
            <h2 className="text-xl font-bold text-[var(--gf-text)]" style={{ fontFamily: "'Lora', serif" }}>Colour Challenge</h2>
            <p className="gf-muted text-sm text-center max-w-xs">
              A colour word appears on screen. Ignore what it says — tap the button matching the <strong>ink colour</strong>.
            </p>
            <button onClick={start} className="mt-2 rounded-xl px-8 py-3 font-bold text-[#012016]"
              style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)", boxShadow: "0 6px 20px rgba(31,191,117,0.35)" }}>
              Start (60s)
            </button>
          </div>
        )}

        {done && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">🏁</div>
            <h2 className="text-xl font-bold text-[var(--gf-text)]" style={{ fontFamily: "'Lora', serif" }}>Time&apos;s Up!</h2>
            <p className="gf-muted">You scored <span className="text-[#6effc4] font-bold text-lg">{score}</span> points</p>
            {score >= best && score > 0 && <p className="text-[#fbbf24] font-semibold text-sm">🏆 New personal best!</p>}
            <button onClick={start} className="mt-2 rounded-xl px-8 py-3 font-bold text-[#012016]"
              style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)", boxShadow: "0 6px 20px rgba(31,191,117,0.35)" }}>
              Play Again
            </button>
          </div>
        )}

        {running && (
          <>
            {/* The word */}
            <div className="flex items-center justify-center" style={{ minHeight: 100 }}>
              <span
                className="font-black tracking-wider select-none"
                style={{
                  fontSize:   "clamp(2.5rem, 8vw, 5rem)",
                  color:      round.textColor,
                  fontFamily: "'Lora', serif",
                  textShadow: `0 0 40px ${round.textColor}55`,
                }}
              >
                {round.word}
              </span>
            </div>

            <p className="text-xs gf-muted">Tap the colour this text is written in:</p>

            {/* Colour buttons */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {COLORS.map(({ name, hex }) => (
                <button
                  key={hex}
                  onClick={() => answer(hex)}
                  className="rounded-xl py-3 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `${hex}22`,
                    border:     `2px solid ${hex}66`,
                    color:       hex,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
