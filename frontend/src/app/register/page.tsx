"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { registerUser } from "../actions/auth";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded: { exp: number } = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp > now) {
        router.push('/dashboard');
      }
      else {
        localStorage.removeItem('accessToken');
      }

    }
  }, [router]);


  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); // prevent page reload
    if (!name || !email || !password || !confirmPassword)
      toast.error('Required fields missing');
    if (password != confirmPassword)
      toast.error('Passwords do not match');
    else {
      const user = await registerUser({ name, email, password });
      if (user && user.accessToken) {
        localStorage.setItem('accessToken', user.accessToken);
        router.push('/dashboard')
        toast.success('Register successful');
      }
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 40%, #e6faef 0%, #d4f3e0 25%), linear-gradient(180deg, #def8e8, #bfe7c5)",
        fontFamily: "'Lora','Georgia', serif",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          width: "90%",
          maxWidth: 650,
          background: "rgba(255,255,255,0.75)",
          padding: "45px 40px",
          borderRadius: 22,
          boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Image
          src="/logo3.png"
          width={130}
          height={130}
          alt="Grow Flow"
          style={{ marginBottom: 15 }}
        />

        <h1 style={{ fontSize: "2.4rem", color: "#123716", fontWeight: 700 }}>
          Create Your GrowFlow Account
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            marginTop: 8,
            color: "#234d2b",
            opacity: 0.9,
            marginBottom: 20,
          }}
        >
          Begin your journey of mindful growth 🌱
        </p>

        {/* SIGNUP FORM */}
        <form
          onSubmit={handleRegister}
          style={{ marginTop: 20, textAlign: "left" }}
        >
          {/* NAME */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #cde8d4",
              fontSize: "1.05rem",
            }}
          />

          {/* EMAIL */}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #cde8d4",
              fontSize: "1.05rem",
            }}
          />

          {/* PASSWORD */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #cde8d4",
              fontSize: "1.05rem",
            }}
          />

          {/* CONFIRM PASSWORD */}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: 25,
              borderRadius: 12,
              border: "1px solid #cde8d4",
              fontSize: "1.05rem",
            }}
          />

          {/* CREATE ACCOUNT BUTTON */}
          <button
            type="submit"
            style={{
              marginTop: 10,
              padding: "14px 40px",
              background: "#163b25",
              color: "white",
              fontSize: "1.25rem",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
            }}
          >
            Create Account
          </button>
        </form>

        {/* LOGIN LINK */}
        <p
          style={{
            marginTop: 25,
            fontSize: "1rem",
            color: "#123716",
          }}
        >
          Already a member?{" "}
          <span
            onClick={() => router.push("/login")}
            style={{
              color: "#0a4e2a",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
