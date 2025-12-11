"use client";

import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 40%, #dff8e3 0%, #d0eed4 20%), linear-gradient(180deg, #def8e8, #bfe7c5)",
        fontFamily: "'Lora','Georgia', serif",
        color: "#123716",
        overflowX: "hidden",
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 48px",
        }}
      >
        <Image src="/logo3.png" width={120} height={120} alt="GrowFlow" />

        <div style={{ display: "flex", gap: 32 }}>
          {/* FIXED HOME BUTTON */}
          <a
            style={{
              color: "#123716",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            Home
          </a>

          <a
            style={{
              color: "#123716",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onClick={() => router.push("/about")}
          >
            About
          </a>

          <a
            style={{
              color: "#123716",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onClick={() => router.push("/contact")}
          >
            Contact
          </a>
        </div>

        <a href="/login">
          <button
            style={{
              background: "#163b25",
              color: "white",
              padding: "12px 28px",
              borderRadius: 10,
            }}
          >
            Login
          </button>
        </a>
      </nav>

      {/* ABOUT CONTENT */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginTop: 40,
          padding: "0 20px",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 600 }}>About GrowFlow</h1>

        <p style={{ fontSize: "1.1rem", marginTop: 20, lineHeight: 1.6 }}>
          GrowFlow helps individuals and teams cultivate steady, mindful progress
          through beautifully-designed productivity tools that reduce burnout.
        </p>

        <h2 style={{ fontSize: "1.8rem", marginTop: 40 }}>Meet the Developers</h2>

        {/* DEV CARDS */}
        <div
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            marginTop: 30,
            justifyContent: "center",
          }}
        >
          {/* AHSAN */}
          <div
            style={{
              width: 260,
              background: "white",
              padding: 16,
              borderRadius: 14,
              textAlign: "center",
              boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src="/ahsan.jpeg"
              alt="Ahsan Akhtar"
              width={240}
              height={240}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <h4 style={{ marginTop: 12, fontSize: "1.1rem", fontWeight: 600 }}>
              Ahsan Akhtar
            </h4>
            <p style={{ opacity: 0.8 }}>k224021@nu.edu.pk</p>
          </div>

          {/* ASAD */}
          <div
            style={{
              width: 260,
              background: "white",
              padding: 16,
              borderRadius: 14,
              textAlign: "center",
              boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src="/asad1.jpeg"
              alt="Asad Irfan"
              width={240}
              height={240}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <h4 style={{ marginTop: 12, fontSize: "1.1rem", fontWeight: 600 }}>
              Asad Irfan
            </h4>
            <p style={{ opacity: 0.8 }}>k224276@nu.edu.pk</p>
          </div>

          {/* HASSAN */}
          <div
            style={{
              width: 260,
              background: "white",
              padding: 16,
              borderRadius: 14,
              textAlign: "center",
              boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src="/hassan1.jpeg"
              alt="Hassan Murad"
              width={240}
              height={240}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <h4 style={{ marginTop: 12, fontSize: "1.1rem", fontWeight: 600 }}>
              Hassan Murad
            </h4>
            <p style={{ opacity: 0.8 }}>k224802@nu.edu.pk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
