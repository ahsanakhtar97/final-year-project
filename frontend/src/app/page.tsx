"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import React, { useRef } from "react";

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
      className="w-full h-screen overflow-y-scroll scroll-smooth snap-y snap-mandatory font-serif 
      relative bg-gradient-to-br from-[#021a10] via-[#06361f] to-[#0c4a2a]"
    >
      {/* Glow Effects */}
      <div className="absolute w-[500px] h-[500px] bg-[rgba(72,255,187,0.15)] blur-[140px] top-[-200px] left-[-200px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-[rgba(80,255,200,0.12)] blur-[140px] bottom-[-200px] right-[-200px]"></div>

      {/* ---------------- NAVBAR ---------------- */}
      <motion.nav
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full z-50 
        bg-[rgba(10,45,30,0.7)] backdrop-blur-xl border-b border-white/10 
        py-3 px-6 
        grid grid-cols-3 place-items-center"
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2 justify-start w-full">
          <Image
            src="/logo3.png"
            width={70}
            height={70}
            alt="GrowFlow"
            className="object-contain"
          />
          <span className="text-[#c7ffdc] text-2xl font-bold">GrowFlow</span>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex gap-10 text-lg font-semibold text-[#c7ffdc] justify-center w-full">
          <motion.span
            whileHover={{ scale: 1.1 }}
            onClick={() => scrollToSection(homeRef)}
            className="cursor-pointer hover:text-[#9df2c8]"
          >
            Home
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            onClick={() => scrollToSection(aboutRef)}
            className="cursor-pointer hover:text-[#9df2c8]"
          >
            About
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            onClick={() => scrollToSection(contactRef)}
            className="cursor-pointer hover:text-[#9df2c8]"
          >
            Contact
          </motion.span>
        </div>

        {/* Right: Login Button */}
        <div className="flex justify-end w-full">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="px-6 py-2 rounded-xl font-bold text-[#012016]
            bg-gradient-to-br from-[#1fbf75] to-[#108a54] shadow-lg"
          >
            Login
          </motion.button>
        </div>
      </motion.nav>

      {/* ---------------- HOME SECTION ---------------- */}
      <motion.section
        ref={homeRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="snap-start h-screen flex flex-col items-center justify-center text-center px-6"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-[#c7ffdc] drop-shadow-lg">
          Grow Within, Flow Beyond
        </h1>

        <p className="text-lg md:text-xl text-[#9df2c8] mt-4 max-w-lg leading-relaxed">
          A space to reflect, recharge, and realign with yourself 🌿
        </p>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/register")}
          className="mt-6 bg-gradient-to-br from-[#1fbf75] to-[#108a54] 
          text-[#012016] px-8 py-4 rounded-2xl shadow-xl font-bold text-lg"
        >
          Get Started
        </motion.button>
      </motion.section>

      {/* ---------------- ABOUT SECTION ---------------- */}
      <motion.section
        ref={aboutRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="snap-start min-h-screen py-28 px-6"
      >
        <h1 className="text-center text-4xl md:text-5xl font-bold text-[#c7ffdc] drop-shadow-lg">
          About GrowFlow
        </h1>

        <p className="text-center text-lg mt-6 max-w-3xl mx-auto text-[#9df2c8] leading-relaxed">
          GrowFlow helps individuals and teams cultivate mindful progress by tracking habits,
          improving mindset, reflecting on growth, and staying motivated with guided prompts.
        </p>

        <h2 className="text-center mt-16 text-3xl font-semibold text-[#c7ffdc]">
          Meet the Developers
        </h2>

        {/* Developer Cards */}
        <div className="flex flex-wrap justify-center gap-10 mt-12">
          {[
            { img: "/ahsan.jpeg", name: "Ahsan Akhtar", mail: "k224021@nu.edu.pk" },
            { img: "/asad26.jpeg", name: "Asad Irfan", mail: "k224276@nu.edu.pk" },
            { img: "/hassan2.jpeg", name: "Hassan Murad", mail: "k224802@nu.edu.pk" },
          ].map((dev, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-[rgba(10,45,30,0.7)] backdrop-blur-xl border border-white/10 
              w-72 p-6 rounded-2xl shadow-xl text-center"
            >
              <Image
                src={dev.img}
                width={300}
                height={300}
                alt={dev.name}
                className="w-full aspect-square object-cover rounded-xl shadow-md"
              />
              <h4 className="mt-4 text-xl font-semibold text-[#c7ffdc]">{dev.name}</h4>
              <p className="text-[#9df2c8]">{dev.mail}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ---------------- CONTACT SECTION ---------------- */}
      <motion.section
        ref={contactRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="snap-start min-h-screen py-28 px-6"
      >
        <h1 className="text-center text-4xl font-bold text-[#c7ffdc] drop-shadow-lg">
          Contact Us
        </h1>

        <p className="text-center text-lg mt-3 text-[#9df2c8]">
          Have questions or feedback? We'd love to hear from you.
        </p>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-[rgba(10,45,30,0.7)] backdrop-blur-xl 
          max-w-xl mx-auto mt-10 p-10 rounded-2xl shadow-xl border border-white/10"
        >
          <h3 className="text-xl font-semibold text-[#c7ffdc]">General Support</h3>
          <p className="text-[#9df2c8] mt-1">📩 support@growflow.app</p>

          <h3 className="text-xl font-semibold text-[#c7ffdc] mt-6">Developer Contacts</h3>
          <p className="text-[#9df2c8]">Ahsan — k224021@nu.edu.pk</p>
          <p className="text-[#9df2c8]">Asad — k224276@nu.edu.pk</p>
          <p className="text-[#9df2c8]">Hassan — k224802@nu.edu.pk</p>
        </motion.div>
      </motion.section>
    </div>
  );
}
