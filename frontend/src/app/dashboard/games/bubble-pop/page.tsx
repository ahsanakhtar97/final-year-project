"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WORRY_WORDS = [
  "Stress", "Anxiety", "Worry", "Fear", "Doubt",
  "Pressure", "Panic", "Tension", "Dread", "Overthink",
  "Burnout", "Fatigue", "Overwhelm", "Anger", "Sadness",
  "Frustration", "Guilt", "Shame", "Regret", "Loneliness",
];

interface Bubble {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  popping: boolean;
}

const COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#f472b6",
  "#60a5fa", "#34d399", "#e879f9",
];

let nextId = 1;

export default function BubblePopPage() {
  const [bubbles, setBubbles]   = useState<Bubble[]>([]);
  const [score, setScore]       = useState(0);
  const [lives, setLives]       = useState(3);
  const [level, setLevel]       = useState(1);
  const [running, setRunning]   = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [popped, setPopped]     = useState<number[]>([]);
  const frameRef  = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const spawnRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const livesRef  = useRef(lives);
  const levelRef  = useRef(level);
  const scoreRef  = useRef(score);

  livesRef.current  = lives;
  levelRef.current  = level;
  scoreRef.current  = score;

  const endGame = useCallback(() => {
    setRunning(false);
    setGameOver(true);
    if (frameRef.current)  cancelAnimationFrame(frameRef.current);
    if (spawnRef.current)  clearInterval(spawnRef.current);
  }, []);

  const spawnBubble = useCallback(() => {
    const speed = 0.4 + levelRef.current * 0.2 + Math.random() * 0.4;
    const size  = 70 + Math.random() * 40;
    setBubbles(prev => [
      ...prev.filter(b => !b.popping),
      {
        id:      nextId++,
        word:    WORRY_WORDS[Math.floor(Math.random() * WORRY_WORDS.length)],
        x:       5 + Math.random() * 75,
        y:       105,
        speed,
        size,
        color:   COLORS[Math.floor(Math.random() * COLORS.length)],
        popping: false,
      },
    ]);
  }, []);

  // animation loop
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setBubbles(prev => {
        const next: Bubble[] = [];
        let escaped = 0;
        for (const b of prev) {
          if (b.popping) { next.push(b); continue; }
          const newY = b.y - b.speed;
          if (newY < -15) { escaped++; continue; }
          next.push({ ...b, y: newY });
        }
        if (escaped > 0) {
          setLives(l => {
            const nl = l - escaped;
            if (nl <= 0) { endGame(); return 0; }
            return nl;
          });
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [running, endGame]);

  // spawn loop
  useEffect(() => {
    if (!running) return;
    const interval = Math.max(600, 1600 - level * 150);
    spawnRef.current = setInterval(spawnBubble, interval);
    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [running, level, spawnBubble]);

  // level up
  useEffect(() => {
    if (score > 0 && score % 10 === 0) setLevel(l => Math.min(l + 1, 8));
  }, [score]);

  const popBubble = (id: number) => {
    setPopped(p => [...p, id]);
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popping: true } : b));
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== id));
      setPopped(p => p.filter(x => x !== id));
    }, 300);
    setScore(s => s + 1);
  };

  const start = () => {
    setBubbles([]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setRunning(true);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Bubble Pop</h1>
        <p className="gf-muted">Smash the worry bubbles before they escape! Don&apos;t let stress slip away.</p>
      </header>

      <div className="flex gap-4 flex-wrap">
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Score</span>
          <span className="text-xl font-bold" style={{ color: "#6effc4" }}>{score}</span>
        </div>
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Lives</span>
          <span className="text-xl">{Array.from({ length: 3 }).map((_, i) => i < lives ? "❤️" : "🖤").join("")}</span>
        </div>
        <div className="gf-card px-5 py-3 flex items-center gap-2">
          <span className="text-xs gf-muted font-semibold uppercase tracking-wider">Level</span>
          <span className="text-xl font-bold" style={{ color: "#fbbf24" }}>{level}</span>
        </div>
      </div>

      {/* Game arena */}
      <div
        className="gf-card relative overflow-hidden"
        style={{ height: 420, background: "rgba(6,30,18,0.7)", cursor: running ? "default" : "default" }}
      >
        {/* Start / Game over overlay */}
        {(!running || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20"
            style={{ background: "rgba(2,10,6,0.85)", backdropFilter: "blur(6px)" }}>
            {gameOver && (
              <>
                <div className="text-5xl">💥</div>
                <h2 className="text-2xl font-bold text-[#c7ffdc]" style={{ fontFamily: "'Lora', serif" }}>Game Over!</h2>
                <p className="gf-muted">You popped <span className="text-[#6effc4] font-bold">{score}</span> worry bubbles</p>
              </>
            )}
            {!gameOver && (
              <>
                <div className="text-5xl">🫧</div>
                <h2 className="text-2xl font-bold text-[#c7ffdc]" style={{ fontFamily: "'Lora', serif" }}>Bubble Pop</h2>
                <p className="gf-muted text-center max-w-xs">Tap the bubbles as they rise. Don&apos;t let them escape!</p>
              </>
            )}
            <button
              onClick={start}
              className="mt-2 rounded-xl px-8 py-3 font-bold text-[#012016]"
              style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)", boxShadow: "0 6px 20px rgba(31,191,117,0.35)" }}
            >
              {gameOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}

        {/* Bubbles */}
        {bubbles.map(b => (
          <button
            key={b.id}
            onClick={() => !b.popping && popBubble(b.id)}
            className="absolute flex items-center justify-center rounded-full font-bold text-center leading-tight transition-all"
            style={{
              left:      `${b.x}%`,
              bottom:    `${b.y}%`,
              width:     b.size,
              height:    b.size,
              fontSize:  b.size > 90 ? 11 : 9,
              background: `radial-gradient(circle at 35% 30%, ${b.color}60, ${b.color}25)`,
              border:     `1.5px solid ${b.color}80`,
              color:      b.color,
              boxShadow:  `0 0 20px ${b.color}30`,
              transform:  b.popping ? "scale(1.8)" : "scale(1)",
              opacity:    b.popping ? 0 : 1,
              transition: b.popping ? "transform 0.25s ease-out, opacity 0.25s ease-out" : "none",
              zIndex:     10,
            }}
          >
            {b.word}
          </button>
        ))}

        {/* Ground line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(110,255,196,0.1)" }} />
      </div>
    </div>
  );
}
