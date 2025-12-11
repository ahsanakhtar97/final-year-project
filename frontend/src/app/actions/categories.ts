"use server"

import api from "@/lib/axios";
import { Category } from "@/types/categories";
import { Habit } from "@/types/habits";

export async function getCategories():Promise<Category[]>{
    const res=await api.get<Category[]>('categories/')
    return res.data;
}

export async function getCategory(categoryId:number):Promise<Category>{
    const res=await api.get<Category>(`categories/${categoryId}`);
    return res.data;
}
async function getHabitsByCategoryId(categoryId:number):Promise<Habit[]> {
    const res=await api.get<Habit[]>(`categories/${categoryId}/habits/`);
    return res.data;
    
}

