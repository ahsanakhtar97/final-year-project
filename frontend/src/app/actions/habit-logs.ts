import { CreateUserHabitPayload } from "@/types/user-habits";
import { getHabitsByUserId } from "./user-habits";

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

// ---------------- GET HABIT LOGS BY USER ID ----------------
export const getHabitLogsByUserId = async (userId: number) => {
  try {
    const res = await fetch(`/api/habit-logs?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching habit logs by user ID:", error);
    return [];
  }
};

// ---------------- CREATE HABIT LOG ----------------
export const createHabitLog = async (
  userHabitId: number,
  date: string,
  status: string,
  moodScore?: number,
) => {
  try {
    const res = await fetch('/api/habit-logs/complete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userHabitId, date, status, moodScore }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("Error creating habit log:", error);
    throw error;
  }
};

// ---------------- UPDATE HABIT LOG ----------------
export const updateHabitLog = async (logId: number, status: string) => {
  try {
    const res = await fetch(`/api/habit-logs/${logId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("Error updating habit log:", error);
    throw error;
  }
};

// ---------------- COMPLETE HABIT (THE MAIN FUNCTION) ----------------
export async function completeHabit(
  data: CreateUserHabitPayload & { moodScore?: number }
) {
  try {
    // Get all user habits to find the userHabitId
    const userHabits = await getHabitsByUserId(data.userId);
    const matched = (userHabits as Array<{ habitId: number; userHabitId?: number }>).find(
      (h) => h.habitId === data.habitId
    );
    if (!matched || !matched.userHabitId) {
      throw new Error(`No user habit found for habitId ${data.habitId}`);
    }
    const userHabitId = matched.userHabitId;
    const today = new Date().toISOString().split("T")[0];

    // Check if already logged today
    const logs = await getHabitLogsByUserId(data.userId);
    const todayLog = logs.find(
      (log: { userHabitId: number; date: string; logId: number }) =>
        log.userHabitId === userHabitId && log.date === today
    );

    if (todayLog) {
      return await updateHabitLog(todayLog.logId, "completed");
    } else {
      return await createHabitLog(userHabitId, today, "completed", data.moodScore);
    }
  } catch (error) {
    console.error("Error in completeHabit action:", error);
    throw error;
  }
}
