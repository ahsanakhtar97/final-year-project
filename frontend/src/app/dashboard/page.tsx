"use client"
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
import PieChart from '../components/charts/PieChart';

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
    else router.push('login');
},[router]);
    return (
       <div>
      <h1 className="t">Dashboard</h1>
      <div style={styles.pieChartContainer}>
        <span style={styles.pieChartTextStyle}>To Do List Progress</span>
      <PieChart labels={["To do","In Progress","Completed"]} values={[0.3,0.2,0.5]} />
      </div>
    </div>
  )
}
const styles:Record<string,React.CSSProperties>={
    pieChartContainer:{
        width:'400px',
        height:'400px'
    },
    pieChartTextStyle:{
        fontWeight:'bold',
    }

}

export default dashboardPage;