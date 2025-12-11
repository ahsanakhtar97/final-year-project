"use server"
import api from "@/lib/axios";
import { Habit, HabitStreak } from "@/types/habits";
import { CreateUserHabitPayload, UserHabit } from "@/types/user-habits";

// Get all habits by userId
export async function getHabitsByUserId(userId:number){
    const res=await api.get<Habit[]>(`user-habits/user/${userId}`);
    return res.data;
}

export async function getUserHabit(userId:number,habitId:number){
  const res=await api.get<UserHabit>(`user-habits/user/${userId}/habit/${habitId}`);
  return res.data;
}

// Get the best and worst habit by userId and days
export async function getBestWorstHabit(userId: number, days: number=30) {
  try {
    const res = await api.get(`user-habits/user/${userId}/stats/best-worst?days=${days}`);
    return res.data; // { best: {...}, worst: {...} }
  } catch (error: any) {
    console.error("Failed to fetch best/worst habits:", error);
    throw error;
  }
}

export async function getUserStreaks(userId:number):Promise<HabitStreak[]>{
    const res= await api.get<HabitStreak[]>(`user-habits/user/${userId}/stats/streaks`);
    return res.data;
}

export async function fetchDailyCompleted(userId: number, days: number) {
  const res = await api.get<{ date: string; completed: number }[]>(`user-habits/user/${userId}/completed/${days}`);
  return res.data;

}

// Assign a habit

export async function assignHabit(data:CreateUserHabitPayload){
  const res=await api.post('user-habits',data);
  return res.data;
}


// Revoke a habit
export async function revokeHabit(data:CreateUserHabitPayload) {
  const res=await api.delete(`user-habit/user/${data.userId}/habit/${data.habitId}`);
  return res.data;
}