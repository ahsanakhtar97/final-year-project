"use server";

import api
from "@/lib/axios";


export async function getUsers(){
    const res=await api.get('/users');
    return res.data;
}