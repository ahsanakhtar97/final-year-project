"use client";

import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
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

      {/* CONTENT */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2.6rem", fontWeight: 700 }}>Contact Us</h1>

        <p style={{ fontSize: "1.15rem", opacity: 0.9, marginTop: 10 }}>
          Have questions or feedback? We'd love to hear from you.
        </p>

        {/* CONTACT BOX */}
        <div
          style={{
            background: "white",
            padding: "28px",
            borderRadius: 20,
            boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
            marginTop: 40,
            textAlign: "left",
          }}
        >
          <h3 style={{ fontSize: "1.3rem", fontWeight: 600 }}>General Support</h3>
          <p style={{ fontSize: "1.05rem", opacity: 0.9, marginTop: 4 }}>
            📩 support@growflow.app
          </p>

          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              marginTop: 28,
            }}
          >
            Developer Contacts
          </h3>

          <p style={{ fontSize: "1.05rem", opacity: 0.9 }}>Ahsan — k224021@nu.edu.pk</p>
          <p style={{ fontSize: "1.05rem", opacity: 0.9 }}>Asad — k224276@nu.edu.pk</p>
          <p style={{ fontSize: "1.05rem", opacity: 0.9 }}>Hassan — k224802@nu.edu.pk</p>
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            background: "#163b25",
            color: "white",
            padding: "12px 24px",
            borderRadius: 10,
            cursor: "pointer",
            marginTop: 35,
            fontSize: "1rem",
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
