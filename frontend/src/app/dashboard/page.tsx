"use client"
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const dashboardPage = () => {
    const router=useRouter();
    function handleLogout(){
        localStorage.removeItem('accessToken');
        router.push('/login');
    }
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
    <div>Welcome to dashboard</div>
    <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default dashboardPage;