import { CreateUserHabitPayload } from "@/types/user-habits";
import axios from "axios";
import { getUserHabit } from "./user-habits";
// Assuming you have getUserId imported somewhere if needed for other file use

const BASE_URL = "/habit-logs";

// ---------------- CREATE HABIT LOG ----------------
export const createHabitLog = async (userHabitId: number, date: string, status: "completed" | "not_completed") => {
  try {
    const response = await axios.post(BASE_URL, { userHabitId, date, status });
    return response.data;
  } catch (error: any) {
    console.error("Error creating habit log:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------- GET ALL HABIT LOGS (GENERAL) ----------------
// Retaining original, though it's likely the source of the 404 if permissions/path are strict.
export const getAllHabitLogs = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching habit logs:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------- GET HABIT LOGS BY USER ID (New Function) ----------------
// Assuming the backend endpoint accepts a query parameter like ?userId=
export const getHabitLogsByUserId = async (userId: number) => {
  try {
    // FIX: Using query parameter to filter logs for the specific user
    const response = await axios.get(`${BASE_URL}?userId=${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching habit logs by user ID:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------- GET ONE HABIT LOG ----------------
export const getHabitLog = async (logId: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/${logId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching habit log:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------- UPDATE HABIT LOG ----------------
export const updateHabitLog = async (logId: number, status: "completed" | "not_completed") => {
  try {
    const response = await axios.patch(`${BASE_URL}/${logId}`, { status });
    return response.data;
  } catch (error: any) {
    console.error("Error updating habit log:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------- DELETE HABIT LOG ----------------
export const deleteHabitLog = async (logId: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${logId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting habit log:", error.response?.data || error.message);
    throw error;
  }
};


export async function completeHabit(data: CreateUserHabitPayload) {
  try {
    const userHabit = await getUserHabit(data.userId, data.habitId);
    const userHabitId = userHabit.userHabitId;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // FIX: Fetch habit logs specifically for the user, not all logs
    const logs = await getHabitLogsByUserId(data.userId);

    const todayLog = logs.find(
      (log: any) => log.userHabitId === userHabitId && log.date === today
    );

    if (todayLog) {
      // Update existing log to completed
      return await updateHabitLog(todayLog.logId, "completed");
    } else {
      // Create a new log for today
      return await createHabitLog(userHabitId, today, "completed");
    }
  } catch (error) {
    console.error("Error completing habit:", error);
    throw error;
  }
}