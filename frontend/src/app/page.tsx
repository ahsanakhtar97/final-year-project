"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import React, { useRef, useState, useEffect } from "react";
import {
  Menu,
  X,
  Sparkles,
  Target,
  BookOpen,
  ArrowRight,
  Brain,
  Heart,
  Gamepad2,
  Calendar,
  Trophy,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Mail,
  Github,
  Stethoscope,
} from "lucide-react";

const HeroScene = dynamic(() => import("./components/hero-scene"), {
  ssr: false,
  loading: () => null,
});

const FEATURES = [
  {
    icon: Heart,
    title: "Mood Tracking",
    desc: "Log your emotional state daily with rich tags and notes. Visualise patterns over weeks and months.",
    color: "#f97171",
    bg: "rgba(249,113,113,0.1)",
  },
  {
    icon: Target,
    title: "Task Management",
    desc: "Kanban-style to-do board with priority levels, due dates, focus timers, and completion streaks.",
    color: "#6effc4",
    bg: "rgba(110,255,196,0.1)",
  },
  {
    icon: Stethoscope,
    title: "Professional Care",
    desc: "Browse verified psychiatrists and psychologists, book sessions, and join video calls in-app.",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
  },
  {
    icon: Brain,
    title: "AI Insights",
    desc: "Get personalised reflections and pattern analysis powered by AI — private and always kind.",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.1)",
  },
  {
    icon: Gamepad2,
    title: "Wellness Games",
    desc: "Memory cards, gratitude jar, and word association — small moments of play that actually help.",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
  },
  {
    icon: Trophy,
    title: "Gamification",
    desc: "Earn XP for every healthy habit. Level up, unlock badges, and make progress feel rewarding.",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.1)",
  },
  {
    icon: BookOpen,
    title: "Growth Journal",
    desc: "Free-write in your private journal. AI reflects back with thoughtful, non-judgmental feedback.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    desc: "See mood, focus time, task completion, and wellness trends through beautiful, live charts.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create your account",
    desc: "Sign up in seconds. No subscriptions, no ads — just your personal wellness space.",
  },
  {
    step: "02",
    title: "Build daily rituals",
    desc: "Track mood, complete tasks, write in your journal. Every small action adds up to real change.",
  },
  {
    step: "03",
    title: "Connect with professionals",
    desc: "When you need more than self-care, browse verified therapists and book a session directly.",
  },
];

const TEAM = [
  { name: "Ahsan Akhtar", roll: "22K-4021", role: "Full Stack" },
  { name: "Hassan Murad", roll: "22K-4802", role: "Full Stack" },
  { name: "Asad Irfan",   roll: "22K-4276", role: "Full Stack" },
];

const STATS = [
  { value: "8+",   label: "Core features" },
  { value: "7",    label: "Wellness games" },
  { value: "100%", label: "Ad-free" },
  { value: "∞",    label: "Daily streaks" },
];

export default function Home() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply saved colour theme so the landing page matches the dashboard.
  useEffect(() => {
    const saved = localStorage.getItem("color_theme");
    if (saved) {
      document.documentElement.setAttribute("data-color-theme", saved);
    }
    const savedMode = localStorage.getItem("global_theme");
    if (savedMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedMode === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const homeRef     = useRef<HTMLDivElement>(null);
  const aboutRef    = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const teamRef     = useRef<HTMLDivElement>(null);
  const contactRef  = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const navLinks: { label: string; ref: React.RefObject<HTMLDivElement | null> }[] = [
    { label: "Home",     ref: homeRef },
    { label: "Features", ref: featuresRef },
    { label: "About",    ref: aboutRef },
    { label: "Team",     ref: teamRef },
    { label: "Contact",  ref: contactRef },
  ];

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden"
      style={{
        background: "linear-gradient(135deg,#021a10 0%,#06361f 50%,#0c4a2a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Ambient glows */}
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
      <motion.div
        animate={{ x: [0, 60, -40, 0], y: [0, -40, 80, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        aria-hidden
        className="pointer-events-none fixed top-1/2 left-1/2 h-[600px] w-[600px] rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ background: "rgba(31,191,117,0.05)", filter: "blur(180px)" }}
      />

      {/* ── Navbar ── */}
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
          <button onClick={() => scrollToSection(homeRef)} className="flex items-center gap-2" aria-label="Go to top">
            <Image
              src="/logo3.png"
              width={56}
              height={56}
              alt="GrowFlow"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain transition-transform duration-300 hover:rotate-12"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#c7ffdc]" style={{ fontFamily: "'Lora', serif" }}>
              GrowFlow
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-base font-semibold text-[#c7ffdc]">
            {navLinks.map(({ label, ref }) => (
              <motion.button key={label} whileHover={{ y: -2 }} onClick={() => scrollToSection(ref)} className="hover:text-[#9df2c8] transition-colors">
                {label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(92,242,255,0.45)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/login")}
              className="rounded-xl px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base font-bold gf-btn-primary"
              style={{
                background: "linear-gradient(135deg,var(--gf-accent) 0%,var(--gf-accent-mid) 55%,var(--gf-accent-deep) 100%)",
                boxShadow: "0 6px 20px rgba(var(--gf-accent-rgb),0.4), 0 0 0 1px rgba(var(--gf-accent-rgb),0.45) inset",
                color: "var(--gf-btn-primary-text)",
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
                  <button key={label} onClick={() => scrollToSection(ref)} className="rounded-lg px-4 py-2.5 text-left text-base font-medium text-[#c7ffdc] hover:bg-white/10 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        ref={homeRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center pt-24"
      >
        <HeroScene />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, rgba(2,15,9,0.55) 0%, rgba(2,15,9,0.15) 45%, rgba(2,15,9,0) 75%)" }}
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
          style={{ fontFamily: "'Lora', serif", letterSpacing: "-0.02em", textShadow: "0 4px 30px rgba(2,15,9,0.6)" }}
        >
          Grow Within,{" "}
          <span className="gf-holo-text">Flow Beyond</span>
        </motion.h1>

        <p
          className="relative mt-6 max-w-xl text-base sm:text-lg md:text-xl leading-relaxed text-[#9df2c8]/90 opacity-90"
          style={{ textShadow: "0 2px 16px rgba(2,15,9,0.55)" }}
        >
          A mental wellness platform built for students. Track moods, manage
          tasks, connect with therapists, and grow — one day at a time. 🌿
        </p>

        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/signup")}
            className="group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold"
            style={{
              background: "linear-gradient(135deg,var(--gf-accent) 0%,var(--gf-accent-mid) 55%,var(--gf-accent-deep) 100%)",
              boxShadow: "0 14px 38px rgba(var(--gf-accent-rgb),0.45), 0 0 0 1px rgba(var(--gf-accent-rgb),0.55) inset",
              color: "var(--gf-btn-primary-text)",
            }}
          >
            Get started free
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
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

        {/* scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative mt-16 flex flex-col items-center gap-1 text-[#9df2c8]/40 text-xs"
        >
          <span>Scroll to explore</span>
          <ChevronRight size={16} className="rotate-90" />
        </motion.div>
      </motion.section>

      {/* ── Stats Strip ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-y border-white/8 py-10"
        style={{ background: "rgba(10,45,30,0.5)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className="text-3xl sm:text-4xl font-bold"
                style={{
                  fontFamily: "'Lora', serif",
                  background: "linear-gradient(135deg,var(--gf-accent),var(--gf-accent-mid))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {value}
              </div>
              <div className="mt-1 text-sm text-[#9df2c8]/70">{label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <motion.section
        ref={featuresRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-24"
      >
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
            <Sparkles size={14} />
            Everything you need to grow
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
            A complete wellness toolkit
          </h2>
          <p className="mt-4 text-[#9df2c8]/90 text-base sm:text-lg">
            From daily mood logs to professional therapy — everything in one quiet, focused space.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group rounded-2xl border border-white/10 p-6 text-left backdrop-blur cursor-default"
              style={{ background: "rgba(10,45,30,0.6)", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: bg, color }}
              >
                <Icon size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#c7ffdc]" style={{ fontFamily: "'Lora', serif" }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9df2c8]/80">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── How it works ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 py-24"
        style={{ background: "rgba(6,30,18,0.6)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
              <CheckCircle2 size={14} />
              Simple by design
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              How GrowFlow works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div
              aria-hidden
              className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(var(--gf-accent-rgb),0.3), transparent)" }}
            />
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(var(--gf-accent-rgb),0.2), rgba(var(--gf-accent-rgb),0.08))",
                    border: "2px solid rgba(var(--gf-accent-rgb),0.3)",
                    color: "var(--gf-accent)",
                    fontFamily: "'Lora', serif",
                  }}
                >
                  {step}
                </div>
                <h3 className="text-lg font-bold text-[#c7ffdc] mb-2" style={{ fontFamily: "'Lora', serif" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#9df2c8]/80 max-w-xs">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── About ── */}
      <motion.section
        ref={aboutRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
          <Heart size={14} />
          Our mission
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
          Built with care
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-[#9df2c8]/90">
          GrowFlow is a final-year project born from a simple belief — that mental wellness shouldn&apos;t
          be complicated or expensive. We set out to build a space where students can reflect, recharge,
          and access professional support without friction. It&apos;s ad-free, distraction-free, and
          designed to feel like a deep breath.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { label: "Ad-free forever", icon: "🚫" },
            { label: "Privacy first",   icon: "🔒" },
            { label: "Student focused", icon: "🎓" },
          ].map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-[#c7ffdc]"
            >
              <span className="text-xl">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Team ── */}
      <motion.section
        ref={teamRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 py-24"
        style={{ background: "rgba(6,30,18,0.6)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
              <Sparkles size={14} />
              The people behind it
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#c7ffdc] tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              Meet the team
            </h2>
            <p className="mt-4 text-[#9df2c8]/80 text-base">
              Final-year Computer Science students at FAST-NUCES, Karachi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-3xl mx-auto">
            {TEAM.map(({ name, roll, role }, i) => (
              <motion.div
                key={roll}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="flex-1 w-full max-w-xs rounded-2xl border border-white/10 p-7 text-center backdrop-blur"
                style={{ background: "rgba(var(--gf-glass-dark-rgb,10,45,30),0.7)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
              >
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg,var(--gf-accent-mid),var(--gf-accent-deep))",
                    color: "var(--gf-btn-primary-text)",
                    boxShadow: "0 6px 20px rgba(var(--gf-accent-rgb),0.35)",
                    fontFamily: "'Lora', serif",
                  }}
                >
                  {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif", color: "var(--gf-accent-3)" }}>
                  {name}
                </h3>
                <div
                  className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(var(--gf-accent-rgb),0.12)", color: "var(--gf-accent)" }}
                >
                  {roll}
                </div>
                <p className="mt-2 text-xs" style={{ color: "rgba(var(--gf-accent-rgb),0.6)" }}>{role} Developer</p>
              </motion.div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-[#9df2c8]/50">
            Final Year Project &mdash; BS Computer Science &mdash; FAST-NUCES Karachi &mdash; 2025
          </p>
        </div>
      </motion.section>

      {/* ── Contact ── */}
      <motion.section
        ref={contactRef}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c7ffdc]/90">
          <Mail size={14} />
          Get in touch
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#c7ffdc]" style={{ fontFamily: "'Lora', serif" }}>
          Say hello
        </h2>
        <p className="mt-3 text-[#9df2c8]/80 max-w-md mx-auto">
          Questions, feedback, or just want to talk about mental wellness? We&apos;d love to hear from you.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:hello@growflow.app"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-[#c7ffdc] backdrop-blur hover:bg-white/10 transition-colors"
          >
            <Mail size={18} className="text-[#6effc4]" />
            hello@growflow.app
          </a>
          <a
            href="https://github.com/ahsanakhtar97/final-year-project"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-[#c7ffdc] backdrop-blur hover:bg-white/10 transition-colors"
          >
            <Github size={18} className="text-[#6effc4]" />
            GitHub
          </a>
        </div>
      </motion.section>

      {/* ── CTA Banner ── */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pb-24"
      >
        <div
          className="rounded-3xl p-10 sm:p-14 text-center"
          style={{
            background: "linear-gradient(135deg,rgba(var(--gf-accent-rgb),0.15) 0%,rgba(var(--gf-accent-rgb),0.06) 100%)",
            border: "1px solid rgba(var(--gf-accent-rgb),0.2)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(var(--gf-accent-rgb),0.1)",
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Lora', serif", color: "var(--gf-accent-3)" }}>
            Start your wellness journey today
          </h2>
          <p className="mt-4 max-w-md mx-auto" style={{ color: "rgba(var(--gf-accent-rgb),0.7)" }}>
            Free to use. No credit card needed. Just you, your growth, and a space to breathe.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/signup")}
            className="group mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold"
            style={{
              background: "linear-gradient(135deg,var(--gf-accent) 0%,var(--gf-accent-mid) 55%,var(--gf-accent-deep) 100%)",
              boxShadow: "0 14px 38px rgba(var(--gf-accent-rgb),0.45)",
              color: "var(--gf-btn-primary-text)",
            }}
          >
            Create free account
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 border-t border-white/5 py-10"
        style={{ background: "rgba(4,18,12,0.9)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image src="/logo3.png" width={32} height={32} alt="GrowFlow" className="h-8 w-8 object-contain opacity-80" />
              <span className="text-base font-bold text-[#c7ffdc]/80" style={{ fontFamily: "'Lora', serif" }}>GrowFlow</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9df2c8]/60">
              {navLinks.map(({ label, ref }) => (
                <button key={label} onClick={() => scrollToSection(ref)} className="hover:text-[#9df2c8] transition-colors">
                  {label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#9df2c8]/40 text-center md:text-right">
              <div className="mb-1 text-[#9df2c8]/60 font-medium">Developed by</div>
              {TEAM.map(({ name, roll }) => (
                <div key={roll}>{name} · {roll}</div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-[#9df2c8]/40">
            © {new Date().getFullYear()} GrowFlow &mdash; Grow within, flow beyond &mdash; FAST-NUCES Karachi
          </div>
        </div>
      </footer>
    </div>
  );
}
