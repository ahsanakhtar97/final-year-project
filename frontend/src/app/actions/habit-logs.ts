import api from "@/lib/axios"; // Use your configured instance
import { CreateUserHabitPayload } from "@/types/user-habits";
import { getUserHabit } from "./user-habits";

const BASE_URL = "/habit-logs";

// ---------------- CREATE HABIT LOG ----------------
type ApiError = { response?: { data?: unknown }; message?: string };
const describe = (e: unknown): unknown => {
  const err = e as ApiError;
  return err.response?.data ?? err.message ?? e;
};

export const createHabitLog = async (
  userHabitId: number,
  date: string,
  status: string,
  moodScore?: number,
) => {
  try {
    const response = await api.post(`${BASE_URL}/complete`, {
      userHabitId,
      date,
      status,
      moodScore,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating habit log:", describe(error));
    throw error;
  }
};

// ---------------- GET HABIT LOGS BY USER ID ----------------
export const getHabitLogsByUserId = async (userId: number) => {
  try {
    const response = await api.get(`${BASE_URL}?userId=${userId}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching habit logs by user ID:", describe(error));
    return [];
  }
};

// ---------------- UPDATE HABIT LOG ----------------
export const updateHabitLog = async (logId: number, status: string) => {
  try {
    const response = await api.patch(`${BASE_URL}/${logId}`, { status });
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating habit log:", describe(error));
    throw error;
  }
};

// ---------------- COMPLETE HABIT (THE MAIN FUNCTION) ----------------
export async function completeHabit(data: CreateUserHabitPayload & { moodScore?: number }) {
  try {
    const userHabit = await getUserHabit(data.userId, data.habitId);
    const userHabitId = userHabit.userHabitId;
    const today = new Date().toISOString().split("T")[0];

    // Fetch existing logs to see if we already logged today
    const logs = await getHabitLogsByUserId(data.userId);

    const todayLog = logs.find(
      (log: { userHabitId: number; date: string }) =>
        log.userHabitId === userHabitId && log.date === today,
    );

    if (todayLog) {
      // Update existing log
      return await updateHabitLog(todayLog.logId, "completed");
    } else {
      // Create new log with the Mood Score from the UI
      return await createHabitLog(userHabitId, today, "completed", data.moodScore);
    }
  } catch (error) {
    console.error("Error in completeHabit action:", error);
    throw error;
  }
}