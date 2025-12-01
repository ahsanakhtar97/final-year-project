import api from "@/lib/axios";
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

async function loginUser(data:LoginPayload):Promise<LoginResponse>{
    const res=await api.post<LoginResponse>('/auth/login',data);
    console.log(res.data);
    return res.data;
}

export default loginUser;