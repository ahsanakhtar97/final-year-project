"use client";

/**
 * HabitHeatmap — GitHub-style 52×7 contribution grid.
 *
 * Shows the past 364 days (52 full weeks) of habit completions.
 * Intensity is driven by how many habits the user completed each day,
 * normalised to a 0–4 scale so colour ramps smoothly.
 */

import { useMemo, useState } from "react";

interface DayData {
  date: string;          // "YYYY-MM-DD"
  completed: number;     // logs with status = "completed"
}

interface Props {
  /** Raw habit log rows from GET /habit-logs?userId= */
  logs: { date: string; status: string }[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKS = 52;

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Returns opacity 0–1 for a given completion count, relative to max seen. */
function intensity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  // bucket into 4 levels so the scale is clear even with sparse data
  const ratio = count / max;
  if (ratio < 0.25) return 0.2;
  if (ratio < 0.5)  return 0.45;
  if (ratio < 0.75) return 0.70;
  return 1;
}

export default function HabitHeatmap({ logs }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  /** Build a map from "YYYY-MM-DD" → completed count */
  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      if (log.status !== "completed") continue;
      const day = log.date?.slice(0, 10);
      if (!day) continue;
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return map;
  }, [logs]);

  /** Build the grid: array of 52 columns, each column = 7 days (Sun→Sat) */
  const { grid, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    // Walk back to the most recent Saturday so the grid starts cleanly
    const end = new Date(today);
    end.setDate(end.getDate() - end.getDay() + 6); // last Saturday

    const grid: DayData[][] = []; // grid[week][dayOfWeek]
    let max = 1;

    for (let w = WEEKS - 1; w >= 0; w--) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(end);
        day.setDate(end.getDate() - (w * 7) - (6 - d));
        const ymd = toYMD(day);
        const completed = countByDay.get(ymd) ?? 0;
        if (completed > max) max = completed;
        week.push({ date: ymd, completed });
      }
      grid.push(week);
    }

    // Month labels: find the first week that contains the 1st of a new month
    const labels: { week: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < grid.length; w++) {
      const firstDay = new Date(grid[w][0].date);
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ week: w, label: MONTHS[m] });
        lastMonth = m;
      }
    }

    return { grid, monthLabels: labels, maxCount: max };
  }, [countByDay]);

  const totalCompleted = useMemo(
    () => [...countByDay.values()].reduce((s, v) => s + v, 0),
    [countByDay],
  );

  const activeDays = useMemo(() => countByDay.size, [countByDay]);

  const CELL = 13; // px per cell
  const GAP  = 2;  // px gap

  return (
    <div className="space-y-3">
      {/* Stats strip */}
      <div className="flex items-center gap-6 text-xs gf-muted flex-wrap">
        <span><strong style={{ color: "var(--gf-accent)" }}>{totalCompleted}</strong> habit completions in the last year</span>
        <span><strong style={{ color: "var(--gf-accent)" }}>{activeDays}</strong> active days</span>
      </div>

      {/* Grid */}
      <div className="relative overflow-x-auto pb-1">
        <div
          className="relative"
          style={{ width: WEEKS * (CELL + GAP) + 28, minWidth: 0 }}
        >
          {/* Month labels */}
          <div className="flex mb-1 pl-7" style={{ gap: 0 }}>
            {monthLabels.map(({ week, label }) => (
              <span
                key={`${label}-${week}`}
                className="text-[10px] gf-muted absolute"
                style={{ left: 28 + week * (CELL + GAP) }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex mt-4" style={{ gap: 0 }}>
            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1" style={{ gap: GAP }}>
              {DAYS.map((d, i) => (
                <span
                  key={d}
                  className="text-[10px] gf-muted flex items-center justify-end pr-1"
                  style={{ height: CELL, lineHeight: `${CELL}px`, opacity: i % 2 === 1 ? 1 : 0 }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap: GAP }}>
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((cell, di) => {
                    const alpha = intensity(cell.completed, maxCount);
                    const isFuture = new Date(cell.date) > new Date();
                    return (
                      <div
                        key={di}
                        className="rounded-sm cursor-default transition-transform hover:scale-125"
                        style={{
                          width: CELL,
                          height: CELL,
                          background: isFuture
                            ? "transparent"
                            : alpha === 0
                            ? "rgba(var(--gf-accent-rgb), 0.07)"
                            : `rgba(var(--gf-accent-rgb), ${alpha})`,
                          boxShadow: alpha > 0.6
                            ? `0 0 6px rgba(var(--gf-accent-rgb), ${alpha * 0.5})`
                            : undefined,
                        }}
                        onMouseEnter={e => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          const label = isFuture
                            ? cell.date
                            : cell.completed === 0
                            ? `${cell.date} — no completions`
                            : `${cell.date} — ${cell.completed} habit${cell.completed !== 1 ? "s" : ""} completed`;
                          setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 4, label });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] gf-muted">
        <span>Less</span>
        {[0.07, 0.2, 0.45, 0.7, 1].map(a => (
          <div
            key={a}
            className="rounded-sm"
            style={{
              width: CELL,
              height: CELL,
              background: `rgba(var(--gf-accent-rgb), ${a})`,
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-lg text-[11px] font-medium shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "var(--gf-surface)",
            border: "1px solid var(--gf-border)",
            color: "var(--gf-text)",
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
