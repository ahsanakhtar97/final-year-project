import api from "@/lib/axios";
import { register } from "module";
interface LoginPayload {
    email:string;
    password:string;
}

interface LoginResponse{
    accessToken:string;
    userId:number;
    name:string;
    email:string;
}
interface RegisterPayload{
    name:string;
    email:string;
    password:string;
}

export async function loginUser(data:LoginPayload):Promise<LoginResponse>{
    const res=await api.post<LoginResponse>('/auth/login',data);
    console.log(res.data);
    return res.data;
}
export async function registerUser(data:RegisterPayload):Promise<LoginResponse>{
    const res=await api.post<LoginResponse>('./auth/register',data);
    return res.data;
}
