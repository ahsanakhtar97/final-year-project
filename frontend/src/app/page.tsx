"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import React, { useRef, useState } from "react";
import {
  Menu,
  X,
  Sparkles,
  Target,
  BookOpen,
  ArrowRight,
} from "lucide-react";

// Three.js touches `window` on import, so it must stay client-only.
const HeroScene = dynamic(() => import("./components/hero-scene"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const navLinks: { label: string; ref: React.RefObject<HTMLDivElement | null> }[] = [
    { label: "Home", ref: homeRef },
    { label: "Features", ref: featuresRef },
    { label: "About", ref: aboutRef },
    { label: "Contact", ref: contactRef },
  ];

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden"
      style={{
        background:
          "linear-gradient(135deg,#021a10 0%,#06361f 50%,#0c4a2a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Ambient animated glows */}
      <motion.div
        animate={{ x: [0, 100, -50, 0], y: [0, -80, 50, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        aria-hidden
        className="pointer-events-none fixed -top-48 -left-48 h-[500px] w-[500px] rounded-full"
        style={{ background: "rgba(72,255,187,0.15)", filter: "blur(140px)" }}
      />
      <motion.div
        animate={{ x: [0, -120, 80, 0], y: [0, 100, -60, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        aria-hidden
        className="pointer-events-none fixed -bottom-48 -right-48 h-[500px] w-[500px] rounded-full"
        style={{ background: "rgba(80,255,200,0.12)", filter: "blur(140px)" }}
      />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 z-50 w-full border-b border-white/10 px-4 py-3 sm:px-6"
        style={{
          background: "rgba(10,45,30,0.7)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={() => scrollToSection(homeRef)}
            className="flex items-center gap-2"
            aria-label="Go to top"
          >
            <Image
              src="/logo3.png"
              width={56}
              height={56}
              alt="GrowFlow"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain transition-transform duration-300 hover:rotate-12"
            />
            <span
              className="text-lg sm:text-xl font-bold tracking-tight text-[#c7ffdc]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              GrowFlow
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-base font-semibold text-[#c7ffdc]">
            {navLinks.map(({ label, ref }) => (
              <motion.button
                key={label}
                whileHover={{ y: -2 }}
                onClick={() => scrollToSection(ref)}
                className="hover:text-[#9df2c8] transition-colors"
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Login + mobile toggle */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{
                scale: 1.04,
                boxShadow: "0 0 28px rgba(92,242,255,0.45)",
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/login")}
              className="rounded-xl px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base font-bold text-[#012016]"
              style={{
                background: "linear-gradient(135deg,#6effc4 0%,#1fbf75 55%,#108a54 100%)",
                boxShadow:
                  "0 6px 20px rgba(31,191,117,0.4), 0 0 0 1px rgba(110,255,196,0.45) inset",
              }}
            >
              Login
            </motion.button>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden rounded-lg p-2 text-[#c7ffdc] hover:bg-white/10 transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="mt-3 flex flex-col gap-1 rounded-xl border border-white/10 bg-[rgba(6,25,18,0.9)] p-2">
                {navLinks.map(({ label, ref }) => (
                  <button
                    key={label}
                    onClick={() => scrollToSection(ref)}
                    className="rounded-lg px-4 py-2.5 text-left text-base font-medium text-[#c7ffdc] hover:bg-white/10 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={homeRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center pt-24"
      >
        {/* 3D breathing blob -- mounts client-side, paints behind the headline. */}
        <HeroScene />

        {/* Soft radial darken so the headline always reads against the blob. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(2,15,9,0.55) 0%, rgba(2,15,9,0.15) 45%, rgba(2,15,9,0) 75%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs sm:text-sm text-[#c7ffdc]/90"
        >
          <Sparkles size={14} />
          Your daily space for mindful growth
        </motion.div>

        <motion.h1
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative text-4xl sm:text-6xl md:text-7xl font-bold leading-tight text-[#c7ffdc] drop-shadow-lg"
          style={{
            fontFamily: "'Lora', serif",
            letterSpacing: "-0.02em",
            textShadow: "0 4px 30px rgba(2,15,9,0.6)",
          }}
        >
          Grow Within,{" "}
          <span className="gf-holo-text">
            Flow Beyond
          </span>
        </motion.h1>

        <p
          className="relative mt-6 max-w-xl text-base sm:text-lg md:text-xl leading-relaxed text-[#9df2c8]/90 opacity-90"
          style={{ textShadow: "0 2px 16px rgba(2,15,9,0.55)" }}
        >
          A space to reflect, recharge, and realign with yourself. Track habits,
          log moods, and let AI guide your growth. 🌿
        </p>

        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 18px 50px rgba(31,191,117,0.55), 0 0 36px rgba(92,242,255,0.4)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/signup")}
            className="group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-[#012016]"
            style={{
              background: "linear-gradient(135deg,#6effc4 0%,#1fbf75 55%,#108a54 100%)",
              boxShadow:
                "0 14px 38px rgba(31,191,117,0.45), 0 0 0 1px rgba(110,255,196,0.55) inset",
            }}
          >
            Get started
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection(featuresRef)}
            className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-[#c7ffdc] backdrop-blur hover:bg-white/10 transition-colors"
          >
            Explore features
          </motion.button>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        ref={featuresRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pb-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
            <Sparkles size={14} />
            Everything you need to grow
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Gentle tools for daily growth
          </h2>
          <p className="mt-4 text-[#9df2c8]/90 text-base sm:text-lg">
            Build momentum with habits, reflect in your journal, and watch your
            progress bloom.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              icon: Target,
              title: "Habit tracking",
              desc: "Design rituals that stick. Stream, streak, celebrate.",
            },
            {
              icon: BookOpen,
              title: "Growth journal",
              desc: "Free-write in English or Urdu. AI reflects back with kindness.",
            },
            {
              icon: Sparkles,
              title: "Insights dashboard",
              desc: "See mood, focus, and progress through beautiful visuals.",
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 p-6 sm:p-7 text-left backdrop-blur"
              style={{
                background: "rgba(10,45,30,0.6)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(145deg,#1fbf75,#108a54)",
                  color: "#052818",
                  boxShadow: "0 6px 18px rgba(16,138,84,0.35)",
                }}
              >
                <Icon size={20} />
              </div>
              <h3
                className="text-lg sm:text-xl font-bold text-[#c7ffdc]"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {title}
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#9df2c8]/85">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* About */}
      <motion.section
        ref={aboutRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center"
      >
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Built with care
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-[#9df2c8]/90">
          GrowFlow is a final-year project exploring how small, consistent
          rituals plus gentle AI feedback can support mental wellness. It&apos;s
          ad-free, quiet, and designed to feel like a deep breath.
        </p>
      </motion.section>

      {/* Contact */}
      <motion.section
        ref={contactRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pb-24 text-center"
      >
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#c7ffdc]"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Say hello
        </h2>
        <p className="mt-3 text-[#9df2c8]/90">
          Questions, feedback, or just want to chat about growth?
        </p>
        <a
          href="mailto:hello@growflow.app"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-[#c7ffdc] backdrop-blur hover:bg-white/10 transition-colors"
        >
          hello@growflow.app
        </a>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-[#9df2c8]/60">
        © {new Date().getFullYear()} GrowFlow. Grow within, flow beyond.
      </footer>
    </div>
  );
}
