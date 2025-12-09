"use server";

import api
from "@/lib/axios";
import { Task, TaskStatus } from "@/types/tasks";


export async function getUsers(){
    const res=await api.get('/users');
    return res.data;
}

export async function getTasksByUserId(id:number){
    const res=await api.get<Task[]>(`users/${id}/tasks`);
    return res.data;
}
export async function getTasksByStatus(id:number,status:TaskStatus){
    const res=await api.get<Task[]>(`users/${id}/tasks/status/${status}`);
    return res.data;
}
