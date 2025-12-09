"use server"

import api from "@/lib/axios";
import { Habit } from "@/types/habits";



export async function getHabit(habitId:number):Promise<Habit>{
    const res=await api.get<Habit>(`habit/${habitId}`);
    return res.data;
}
export async function getHabits():Promise<Habit[]>{ 
    const res=await api.get<Habit[]>(`habits/`);
    return res.data;
}