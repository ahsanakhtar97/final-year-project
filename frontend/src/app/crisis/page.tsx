"use client";

/**
 * Crisis support page.
 *
 * Public route -- not behind the dashboard auth guard. Anyone (including
 * unauthenticated visitors) can land here. The list is hand-curated, not
 * fetched from the API, so it works offline and during DB outages -- the
 * worst time to make this page depend on a live backend is during a crisis.
 */

import Link from "next/link";
import { ArrowLeft, Phone, Globe, MessageCircle, LifeBuoy } from "lucide-react";

interface Hotline {
  country: string;
  flag: string;
  name: string;
  phone: string;
  hours?: string;
  url?: string;
  text?: string;
}

const HOTLINES: Hotline[] = [
  {
    country: "Pakistan",
    flag: "🇵🇰",
    name: "Umang Helpline (Taskeen Health Initiative)",
    phone: "0311-7786264",
    hours: "Daily, 12pm – 12am PKT",
    url: "https://taskeen.org/umang/",
  },
  {
    country: "Pakistan",
    flag: "🇵🇰",
    name: "Rozan Counselling",
    phone: "0304-1111741",
    hours: "Mon–Sat, 9am – 5pm PKT",
    url: "https://rozan.org",
  },
  {
    country: "United States",
    flag: "🇺🇸",
    name: "988 Suicide and Crisis Lifeline",
    phone: "988",
    hours: "24/7",
    text: "Text HOME to 741741",
    url: "https://988lifeline.org",
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    name: "Samaritans",
    phone: "116 123",
    hours: "24/7, free",
    url: "https://www.samaritans.org",
  },
  {
    country: "India",
    flag: "🇮🇳",
    name: "iCall (TISS)",
    phone: "9152987821",
    hours: "Mon–Sat, 8am – 10pm IST",
    url: "https://icallhelpline.org",
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    name: "Talk Suicide Canada",
    phone: "1-833-456-4566",
    hours: "24/7",
    text: "Text 45645 (4pm – 12am ET)",
    url: "https://talksuicide.ca",
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    name: "Lifeline Australia",
    phone: "13 11 14",
    hours: "24/7",
    url: "https://www.lifeline.org.au",
  },
  {
    country: "International",
    flag: "🌍",
    name: "Find a helpline (any country)",
    phone: "—",
    url: "https://findahelpline.com",
  },
];

export default function CrisisPage() {
  return (
    <div
      className="min-h-screen px-4 py-10 sm:py-16"
      style={{
        background: "linear-gradient(135deg,#06130f 0%, #0f2a21 60%, #163b25 100%)",
        color: "#e7f7ee",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-6"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <header className="mb-8 flex items-start gap-4">
          <div
            className="rounded-xl p-3 shrink-0"
            style={{ background: "rgba(225,76,76,0.18)", color: "#ffb4b4" }}
          >
            <LifeBuoy size={28} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Lora', serif" }}
            >
              You are not alone.
            </h1>
            <p className="mt-2 text-sm sm:text-base opacity-90 leading-relaxed">
              If you&apos;re thinking about hurting yourself, or if someone you love is in danger,
              please reach out to one of the helplines below. They are free, confidential,
              and answered by trained people. Booking an appointment through this app can
              wait — your safety can&apos;t.
            </p>
          </div>
        </header>

        <div className="space-y-3">
          {HOTLINES.map((h, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(15,42,33,0.78)",
                border: "1px solid rgba(174,240,201,0.10)",
                boxShadow:
                  "0 12px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(110,255,196,0.10) inset",
              }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
                <span aria-hidden>{h.flag}</span>
                {h.country}
              </div>
              <div className="mt-1 text-lg font-bold">{h.name}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {h.phone !== "—" && (
                  <a
                    href={`tel:${h.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: "#8fe8b2" }}
                  >
                    <Phone size={14} /> {h.phone}
                  </a>
                )}
                {h.hours && (
                  <span className="opacity-80">{h.hours}</span>
                )}
              </div>
              {h.text && (
                <div className="mt-1 text-sm flex items-center gap-1.5 opacity-90">
                  <MessageCircle size={14} /> {h.text}
                </div>
              )}
              {h.url && (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs opacity-80 hover:opacity-100"
                >
                  <Globe size={12} /> {h.url.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          ))}
        </div>

        <footer className="mt-10 text-center text-xs opacity-70">
          GrowFlow is a wellness companion, not a substitute for emergency or
          medical care. In a life-threatening situation, call your local emergency
          number (112 in PK, 911 in US/CA, 999 in UK).
        </footer>
      </div>
    </div>
  );
}
