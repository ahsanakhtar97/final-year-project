"use client"
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'

const dashboardPage = () => {
    const router=useRouter()
// Reroute to login if token is expired
useEffect(()=>{
    const token=localStorage.getItem('accessToken');
    if(token){
        const decoded:{exp:number}=jwtDecode(token);
        const now=Date.now()/1000;
        if(decoded.exp<now){
            // Token expired
            localStorage.removeItem('accessToken');
            router.push('/login');
        }
    }
},[router]);
    return (
       <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Welcome to your dashboard.</p>
    </div>
  )
}

export default dashboardPage;