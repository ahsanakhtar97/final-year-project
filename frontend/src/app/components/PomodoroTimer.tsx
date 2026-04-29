"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/tasks";
import { addFocusMinutes, updateTaskStatus } from "@/app/actions/tasks";
import { toast } from "react-toastify";
import { useTheme } from "@/app/dashboard/theme-context";

interface Props {
  tasks: Task[];
  onTaskUpdated?: () => void;
}

export default function PomodoroTimer({ tasks, onTaskUpdated }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedTaskId, setSelectedTaskId] = useState<number | "">("");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (mode === "focus") {
      toast.success("Focus session completed!");
      // If a task was selected, log the time
      if (selectedTaskId !== "") {
        try {
          await addFocusMinutes(Number(selectedTaskId), 25);
          toast.success("25 focus minutes added to task!");
          
          if (confirm("Do you want to mark this task as completed?")) {
            await updateTaskStatus(Number(selectedTaskId), "completed" as unknown as never);
            toast.success("Task marked as completed! +10 XP");
          }
          if (onTaskUpdated) onTaskUpdated();
        } catch {
          toast.error("Failed to update task focus time");
        }
      }
      setMode("break");
      setTimeLeft(5 * 60); // 5 min break
    } else {
      toast.info("Break is over! Ready to focus?");
      setMode("focus");
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const openTasks = tasks.filter(t => t.taskStatus !== "completed");

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-xl ${isDark ? 'bg-[#0d281b]/80 border-[#1f4d33] text-white' : 'bg-white/90 border-[#cbe8d2] text-[#163b25]'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Focus Timer</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setMode("focus"); setTimeLeft(25 * 60); setIsRunning(false); }}
            className={mode === "focus" ? "bg-green-500/20 text-green-700 dark:text-green-300" : ""}
          >
            Focus
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setMode("break"); setTimeLeft(5 * 60); setIsRunning(false); }}
            className={mode === "break" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" : ""}
          >
            Break
          </Button>
        </div>
      </div>

      {mode === "focus" && (
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 opacity-80 uppercase tracking-wider">Working on</label>
          <select 
            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1f16] border-[#1f4d33]' : 'bg-gray-50 border-[#cbe8d2]'}`}
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={isRunning}
          >
            <option value="">-- Select a task to focus on --</option>
            {openTasks.map(t => (
              <option key={t.taskId} value={t.taskId}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col items-center justify-center my-6">
        <div className="text-6xl font-black font-mono tabular-nums tracking-tighter" style={{ color: mode === 'focus' ? (isDark ? '#8fe8b2' : '#2ecc71') : (isDark ? '#8fb6e8' : '#3498db') }}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm uppercase tracking-widest mt-2 opacity-60 font-semibold">
          {mode === "focus" ? "Stay focused" : "Take a breather"}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button 
          className="flex-1 py-6 text-lg font-bold shadow-md"
          style={{ 
            background: isRunning 
              ? (isDark ? '#300f0f' : '#fee2e2') 
              : (mode === 'focus' ? (isDark ? '#1f4d33' : '#e6ffef') : (isDark ? '#1f334d' : '#e6f0ff')),
            color: isRunning 
              ? (isDark ? '#ff9999' : '#e74c3c') 
              : (mode === 'focus' ? (isDark ? '#8fe8b2' : '#27ae60') : (isDark ? '#8fb6e8' : '#2980b9')),
          }}
          onClick={toggleTimer}
        >
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button 
          variant="outline" 
          className="py-6 border-2"
          style={{ borderColor: isDark ? '#1f4d33' : '#cbe8d2' }}
          onClick={resetTimer}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
