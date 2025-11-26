"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 40%, #c8e9d0 0%, #b7dbbf 35%, #9ecfa9 70%)",
        fontFamily: "'Lora','Georgia', serif",
      }}
    >
      {/* MAIN CARD */}
      <div
        style={{
          width: "75%",
          maxWidth: 1050,
          height: 520,
          display: "flex",
          borderRadius: 20,
          background: "rgba(255,255,255,0.55)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        {/* LEFT SECTION */}
        <div
          style={{
            width: "50%",
            background: "#f5f5f5",
            padding: "50px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            src="/logo3.png"
            alt="Grow Flow"
            width={180}
            height={180}
            style={{ marginBottom: 20 }}
          />

          <p
            style={{
              fontSize: "1.7rem",
              width: "80%",
              textAlign: "center",
              color: "#123716",
              fontWeight: 600,
            }}
          >
            “Grow through what you go through.”
          </p>
        </div>

        {/* RIGHT SECTION */}
        <div
          style={{
            width: "50%",
            background: "#2f5c3b",
            padding: "50px 50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "white",
          }}
        >
          <h1 style={{ fontSize: "2rem", textAlign: "center", marginBottom: 40 }}>
            Log In
          </h1>

          <label style={{ fontSize: "0.9rem" }}>Username/Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your username/email"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 6,
              marginBottom: 20,
              borderRadius: 8,
              border: "none",
              fontSize: "1rem",
            }}
          />

          <label style={{ fontSize: "0.9rem" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 6,
              marginBottom: 10,
              borderRadius: 8,
              border: "none",
              fontSize: "1rem",
            }}
          />

          <p
            style={{
              textAlign: "right",
              fontSize: "0.85rem",
              cursor: "pointer",
              color: "#e4e4e4",
              marginBottom: 25,
            }}
          >
            Forgot Password?
          </p>

          {/* LOGIN BUTTON */}
          <button
            style={{
              width: "140px",
              background: "#dcdcdc",
              color: "#123716",
              padding: "12px 0",
              borderRadius: 10,
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              alignSelf: "center",
            }}
          >
            Login
          </button>

          {/* SIGN UP BUTTON */}
          <p
            style={{
              marginTop: 25,
              textAlign: "center",
              fontSize: "0.95rem",
            }}
          >
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/get-started")}
              style={{
                color: "#c7fadc",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
