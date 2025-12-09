"use server"

import api from "@/lib/axios";
import { CreateTaskPayload, Task, TaskStatus } from "@/types/tasks";



export async function getTasks(){
    const res=await api.get<Task>('/tasks');
    return res.data;
}

export async function createTask(data:CreateTaskPayload){
    const res=await api.post<string>('/tasks',data);
    console.log(res);

}
export async function removeTask(taskId:number){
    const res=await api.delete<string>(`/tasks/${taskId}`);
    console.log(res);
}
export async function updateTaskStatus(taskId:number,newStatus:TaskStatus){
    const res=await api.patch<string>(`tasks/${taskId}/status/${newStatus}`);
    console.log(res);
}

