"use client";

import Image from "next/image";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  const homeRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
      }}
    >
      {/* ---------------- NAVBAR ---------------- */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 100,
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          padding: "3px 5px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/logo3.png"
            width={90}
            height={90}
            alt="GrowFlow"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Center Links */}
        <div
          style={{
            display: "flex",
            gap: 30,
            fontSize: "1.1rem",
            fontWeight: 500,
          }}
        >
          {["Home", "About", "Contact"].map((text, index) => (
            <motion.span
              key={index}
              whileHover={{ scale: 1.1 }}
              style={{ cursor: "pointer" }}
              onClick={() =>
                scrollToSection(
                  text === "Home"
                    ? homeRef
                    : text === "About"
                    ? aboutRef
                    : contactRef
                )
              }
            >
              {text}
            </motion.span>
          ))}
        </div>

        {/* Login button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          style={{
            width: "80px",
            background: "#dcdcdc",
            color: "#123716",
            padding: "10px 0px",
            borderRadius: 10,
            fontSize: "1.1rem",
            fontWeight: 800,
            cursor: "pointer",
            border: "none",
            boxSizing: "border-box",
            marginRight: "40px",
          }}
        >
          Login
        </motion.button>
      </motion.nav>

      {/* ---------------- HOME SECTION ---------------- */}
      <motion.div
        ref={homeRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        style={{
          scrollSnapAlign: "start",
          width: "100%",
          height: "100vh",
          paddingTop: 300,
          background:
            "radial-gradient(circle at 50% 40%, #dff8e3 0%, #d0eed4 25%), linear-gradient(180deg, #def8e8, #bfe7c5)",
          fontFamily: "'Lora','Georgia', serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 600 }}>
          Grow Within, Flow Beyond
        </h1>

        <p style={{ fontSize: "1.2rem", marginTop: 10 }}>
          A space to reflect, recharge, and realign with yourself.
        </p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/get-started")}
          style={{
            marginTop: 10,
            background: "#163b25",
            color: "white",
            padding: "20px 35px",
            borderRadius: 10,
            cursor: "pointer",
            border: "none",
          }}
        >
          Get Started
        </motion.button>
      </motion.div>

      {/* ---------------- ABOUT SECTION ---------------- */}
      <motion.div
        ref={aboutRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        style={{
          scrollSnapAlign: "start",
          width: "100%",
          minHeight: "100vh",
          padding: "120px 20px 60px",
          background:
            "radial-gradient(circle at 50% 40%, #dff8e3 0%, #d0eed4 25%), linear-gradient(180deg, #def8e8, #bfe7c5)",
          fontFamily: "'Lora','Georgia', serif",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 600, textAlign: "center" }}>
          About GrowFlow
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            marginTop: 20,
            lineHeight: 1.6,
            maxWidth: 900,
            margin: "20px auto",
            textAlign: "center",
          }}
        >
          GrowFlow helps individuals and teams cultivate mindful progress...
        </p>

        <h2
          style={{
            fontSize: "1.8rem",
            marginTop: 40,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Meet the Developers
        </h2>

        {/* Developer Cards */}
        <div
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            marginTop: 30,
            justifyContent: "center",
          }}
        >
          {[
            { img: "/ahsan.jpeg", name: "Ahsan Akhtar", mail: "k224021@nu.edu.pk" },
            { img: "/asad1.jpeg", name: "Asad Irfan", mail: "k224276@nu.edu.pk" },
            { img: "/hassan.png", name: "Hassan Murad", mail: "k224802@nu.edu.pk" },
          ].map((dev, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -6 }}
              transition={{ type: "spring", stiffness: 200 }}
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
                src={dev.img}
                width={240}
                height={240}
                alt={dev.name}
                style={{ borderRadius: 12 }}
              />
              <h4 style={{ marginTop: 12, fontSize: "1.1rem", fontWeight: 600 }}>
                {dev.name}
              </h4>
              <p style={{ opacity: 0.8 }}>{dev.mail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ---------------- CONTACT SECTION ---------------- */}
      <motion.div
        ref={contactRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        style={{
          scrollSnapAlign: "start",
          width: "100%",
          minHeight: "100vh",
          padding: "120px 20px 60px",
          background:
            "radial-gradient(circle at 50% 40%, #dff8e3 0%, #d0eed4 25%), linear-gradient(180deg, #def8e8, #bfe7c5)",
          fontFamily: "'Lora','Georgia', serif",
        }}
      >
        <h1
          style={{ fontSize: "2.6rem", fontWeight: 700, textAlign: "center" }}
        >
          Contact Us
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            opacity: 0.9,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          Have questions or feedback? We'd love to hear from you.
        </p>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: "white",
            padding: 30,
            borderRadius: 18,
            maxWidth: 700,
            margin: "40px auto",
            boxShadow: "0px 4px 14px rgba(0,0,0,0.12)",
          }}
        >
          <h3 style={{ fontSize: "1.3rem", fontWeight: 600 }}>
            General Support
          </h3>
          <p style={{ opacity: 0.8, marginTop: 4 }}>📩 support@growflow.app</p>

          <h3
            style={{ marginTop: 22, fontSize: "1.3rem", fontWeight: 600 }}
          >
            Developer Contacts
          </h3>
          <p>Ahsan — k224021@nu.edu.pk</p>
          <p>Asad — k224276@nu.edu.pk</p>
          <p>Hassan — k224802@nu.edu.pk</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
