"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import loginUser from "../actions/login";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";


export default function LoginPage() {
  const router=useRouter();
  const [email,setEmail]=useState('');
const [password,setPassword]=useState('');

//Reroute to the main page if an accessToken already exists
useEffect(()=>{
const token=localStorage.getItem('accessToken');
if(token){
  const decoded:{exp:number}=jwtDecode(token);
  const now=Date.now()/1000;
  if(decoded.exp>now){
    router.push('/dashboard');
  }
  else{
    localStorage.removeItem('accessToken');
  }

}
},[router]);
async function handleLogin(e:React.FormEvent){
  e.preventDefault();
  try{
  const user=await loginUser({
    email,
    password
  });
  if(user && user.accessToken){
    localStorage.setItem('accessToken',user.accessToken);
    router.push('/dashboard');
  }
}
  catch(err){
  console.error("Login Failed");
  }
}
  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        {/* Left Info Panel */}
        {/* The logo is now the background of this div, set in styles.module.css */}
        <div className={styles.infoPanel}></div>

        {/* Right Form Panel */}
        <div className={styles.formPanel}>
          <h2 className={styles.loginTitle}>Log In</h2>

          <form className={styles.loginForm} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username/Email</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username/email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                required
              />
            </div>

            <a href="#" className={styles.forgotLink}>
              Forgot Password?
            </a>

            <button className={styles.loginBtn} type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
