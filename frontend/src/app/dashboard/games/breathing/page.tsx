"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

const PHASES: { phase: Phase; label: string; duration: number; color: string }[] = [
  { phase: "inhale",   label: "Breathe In",  duration: 4, color: "#6effc4" },
  { phase: "hold-in",  label: "Hold",        duration: 4, color: "#60a5fa" },
  { phase: "exhale",   label: "Breathe Out", duration: 4, color: "#c084fc" },
  { phase: "hold-out", label: "Hold",        duration: 4, color: "#fbbf24" },
];

export default function BreathingPage() {
  const [running, setRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick]         = useState(0);
  const [cycles, setCycles]     = useState(0);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase    = PHASES[phaseIdx];
  const progress = tick / phase.duration; // 0 → 1

  // Size: inhale = grow, exhale = shrink, hold = stay
  const scale = phase.phase === "inhale"
    ? 0.5 + progress * 0.5
    : phase.phase === "exhale"
    ? 1 - progress * 0.5
    : phase.phase === "hold-in" ? 1 : 0.5;

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }

    intervalRef.current = setInterval(() => {
      setTick(prev => {
        if (prev + 1 >= phase.duration) {
          setPhaseIdx(pi => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles(c => c + 1);
            return next;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phaseIdx, phase.duration]);

  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setTick(0);
    setCycles(0);
  };

  const remaining = phase.duration - tick;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Breathing Bubble</h1>
        <p className="gf-muted">Box breathing — 4 seconds each phase. Inhale · Hold · Exhale · Hold.</p>
      </header>

      <div className="gf-card p-6 sm:p-10 flex flex-col items-center gap-8">
        {/* Bubble */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          {/* outer ripple */}
          {running && (
            <div
              className="absolute rounded-full"
              style={{
                width:  `${280 * scale * 1.25}px`,
                height: `${280 * scale * 1.25}px`,
                background: `${phase.color}18`,
                transition: "all 1s linear",
              }}
            />
          )}
          {/* main bubble */}
          <div
            className="rounded-full flex flex-col items-center justify-center text-center select-none"
            style={{
              width:      `${280 * scale}px`,
              height:     `${280 * scale}px`,
              background: `radial-gradient(circle at 35% 35%, ${phase.color}55, ${phase.color}22)`,
              border:     `2px solid ${phase.color}66`,
              boxShadow:  `0 0 60px ${phase.color}33`,
              transition: "all 1s linear",
            }}
          >
            {running ? (
              <>
                <span className="text-4xl font-bold" style={{ color: phase.color, fontFamily: "'Lora', serif" }}>
                  {remaining}
                </span>
                <span className="text-sm mt-1 font-semibold" style={{ color: `${phase.color}cc` }}>
                  {phase.label}
                </span>
              </>
            ) : (
              <span className="text-base font-semibold text-[var(--gf-muted)]">Press Start</span>
            )}
          </div>
        </div>

        {/* Phase indicator dots */}
        <div className="flex items-center gap-3">
          {PHASES.map((p, i) => (
            <div
              key={p.phase}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                style={{
                  background: phaseIdx === i && running ? p.color : "rgba(255,255,255,0.15)",
                  boxShadow:  phaseIdx === i && running ? `0 0 8px ${p.color}` : "none",
                  transform:  phaseIdx === i && running ? "scale(1.4)" : "scale(1)",
                }}
              />
              <span className="text-[10px] text-[var(--gf-muted)]">{p.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Cycles counter */}
        <div className="flex items-center gap-2 text-sm text-[var(--gf-muted)]">
          <span>Cycles completed:</span>
          <span className="font-bold text-[#6effc4] text-lg">{cycles}</span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setRunning(r => !r)}
            className="rounded-xl px-8 py-3 font-bold text-[#012016] transition-all"
            style={{
              background: "linear-gradient(135deg,#6effc4,#1fbf75)",
              boxShadow: "0 6px 20px rgba(31,191,117,0.35)",
            }}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={reset}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-[var(--gf-text)] hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
        </div>

        <p className="text-xs text-[var(--gf-muted)] text-center max-w-sm">
          Box breathing activates the parasympathetic nervous system, reducing stress and anxiety in under 2 minutes.
        </p>
      </div>
    </div>
  );
}
