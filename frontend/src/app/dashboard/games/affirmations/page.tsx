"use client";

import { useState, useEffect } from "react";

const AFFIRMATIONS = [
  "I am enough exactly as I am",
  "I choose peace over worry",
  "I am worthy of love and kindness",
  "My feelings are valid and important",
  "I am stronger than I think",
  "I embrace change with an open mind",
  "I deserve rest and recovery",
  "I am proud of how far I have come",
  "I release what I cannot control",
  "I radiate confidence and calm",
  "I am growing every single day",
  "I trust myself to handle challenges",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface Puzzle {
  original: string[];   // correct word order
  scrambled: string[];  // scrambled word order
}

function makePuzzle(sentence: string): Puzzle {
  const words = sentence.split(" ");
  return { original: words, scrambled: shuffle(words) };
}

export default function AffirmationsPage() {
  const [queue, setQueue]       = useState<string[]>(() => shuffle(AFFIRMATIONS));
  const [idx, setIdx]           = useState(0);
  const [puzzle, setPuzzle]     = useState<Puzzle>(() => makePuzzle(shuffle(AFFIRMATIONS)[0]));
  const [chosen, setChosen]     = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [state, setState]       = useState<"playing" | "correct" | "done">("playing");
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [shakeBank, setShakeBank] = useState(false);

  // init puzzle on index change
  useEffect(() => {
    if (idx >= queue.length) { setState("done"); return; }
    const p = makePuzzle(queue[idx]);
    setPuzzle(p);
    setChosen([]);
    setRemaining(p.scrambled);
    setState("playing");
  }, [idx, queue]);

  const pickWord = (word: string, fromIdx: number) => {
    if (state !== "playing") return;
    const newChosen    = [...chosen, word];
    const newRemaining = remaining.filter((_, i) => i !== fromIdx);
    setChosen(newChosen);
    setRemaining(newRemaining);

    // check correctness so far
    const correct = puzzle.original.slice(0, newChosen.length).every((w, i) => w === newChosen[i]);
    if (!correct) {
      // wrong — shake and reset after delay
      setShakeBank(true);
      setTimeout(() => {
        setChosen([]);
        setRemaining(puzzle.scrambled);
        setShakeBank(false);
      }, 600);
      setStreak(0);
      return;
    }

    if (newChosen.length === puzzle.original.length) {
      setState("correct");
      setScore(s => s + 1 + streak);
      setStreak(s => s + 1);
    }
  };

  const unpickWord = (word: string, fromIdx: number) => {
    if (state !== "playing") return;
    const newChosen    = chosen.filter((_, i) => i !== fromIdx);
    setRemaining(r => [...r, word]);
    setChosen(newChosen);
  };

  const next = () => setIdx(i => i + 1);

  const restart = () => {
    const newQueue = shuffle(AFFIRMATIONS);
    setQueue(newQueue);
    setIdx(0);
    setScore(0);
    setStreak(0);
    setState("playing");
  };

  const progress = (idx / AFFIRMATIONS.length) * 100;

  if (state === "done") {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Affirmation Scramble</h1>
          <p className="gf-muted">Reassemble positive affirmations from their scrambled words.</p>
        </header>
        <div className="gf-card p-10 flex flex-col items-center gap-5 text-center">
          <div className="text-6xl">🌟</div>
          <h2 className="text-2xl font-bold text-[var(--gf-text)]" style={{ fontFamily: "'Lora', serif" }}>All Done!</h2>
          <p className="gf-muted">You completed all {AFFIRMATIONS.length} affirmations</p>
          <p className="text-lg font-bold" style={{ color: "#6effc4" }}>Score: {score}</p>
          <button onClick={restart} className="rounded-xl px-8 py-3 font-bold text-[#012016]"
            style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)", boxShadow: "0 6px 20px rgba(31,191,117,0.35)" }}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Affirmation Scramble</h1>
        <p className="gf-muted">Tap words in the correct order to rebuild the affirmation.</p>
      </header>

      {/* Progress + stats */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Score</span>
          <span className="text-xl font-bold" style={{ color: "#6effc4" }}>{score}</span>
        </div>
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Streak</span>
          <span className="text-xl font-bold" style={{ color: "#fbbf24" }}>🔥{streak}</span>
        </div>
        <div className="gf-card px-4 py-3 flex-1 min-w-[140px]">
          <div className="flex justify-between text-xs gf-muted mb-1.5">
            <span>Progress</span>
            <span>{idx}/{AFFIRMATIONS.length}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6effc4,#1fbf75)" }} />
          </div>
        </div>
      </div>

      {/* Answer area */}
      <div className="gf-card p-5 min-h-[72px] flex flex-wrap gap-2 items-center"
        style={{
          borderColor: state === "correct" ? "#6effc4" : shakeBank ? "#f87171" : undefined,
          borderWidth: state === "correct" || shakeBank ? 2 : 1,
          animation: shakeBank ? "shake 0.5s ease-in-out" : undefined,
        }}>
        {chosen.length === 0 && (
          <span className="gf-muted text-sm italic">Tap words below to build the affirmation…</span>
        )}
        {chosen.map((w, i) => (
          <button key={`c-${i}`} onClick={() => unpickWord(w, i)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: state === "correct" ? "rgba(110,255,196,0.2)" : "rgba(110,255,196,0.12)",
              color: state === "correct" ? "#6effc4" : "var(--gf-text)",
              border: `1px solid ${state === "correct" ? "#6effc420" : "rgba(255,255,255,0.1)"}`,
            }}>
            {w}
          </button>
        ))}
      </div>

      {/* Correct banner */}
      {state === "correct" && (
        <div className="gf-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderLeft: "4px solid #6effc4", background: "rgba(110,255,196,0.06)" }}>
          <div>
            <p className="font-bold text-[#6effc4]">✓ Correct!</p>
            <p className="text-sm gf-muted mt-0.5 italic">&ldquo;{puzzle.original.join(" ")}&rdquo;</p>
          </div>
          <button onClick={next}
            className="rounded-xl px-6 py-2.5 font-bold text-[#012016] whitespace-nowrap"
            style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)" }}>
            Next →
          </button>
        </div>
      )}

      {/* Word bank */}
      <div className="gf-card p-5">
        <p className="text-xs gf-muted font-semibold uppercase tracking-wider mb-3">Word Bank</p>
        <div className="flex flex-wrap gap-2">
          {remaining.map((w, i) => (
            <button key={`r-${i}`} onClick={() => pickWord(w, i)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--gf-text)",
              }}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}
