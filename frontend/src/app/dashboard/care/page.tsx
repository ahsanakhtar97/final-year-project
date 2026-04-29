"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Briefcase, Heart, Clock, Globe, ArrowRight, BadgeCheck, LifeBuoy } from "lucide-react";
import { listProfessionals, type PublicProfessional } from "@/app/actions/professionals";

type Filter = "all" | "psychiatrist" | "psychologist";

export default function CarePage() {
  const [pros, setPros] = useState<PublicProfessional[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listProfessionals(filter === "all" ? undefined : filter);
        if (!cancelled) setPros(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filter]);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return pros.filter((p) => {
      if (verifiedOnly && !p.verified) return false;
      if (!ql) return true;
      return (
        p.name.toLowerCase().includes(ql) ||
        (p.bio ?? "").toLowerCase().includes(ql) ||
        (p.languages ?? "").toLowerCase().includes(ql) ||
        (p.credentials ?? "").toLowerCase().includes(ql)
      );
    });
  }, [pros, q, verifiedOnly]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Care</h1>
        <p className="gf-muted">
          Connect with a registered psychiatrist or psychologist. All appointments
          start as requests; the professional confirms a time that works.
        </p>
      </header>

      {/* Crisis support banner -- always visible at top of /care so anyone
          looking for urgent help finds the hotline first. */}
      <Link
        href="/crisis"
        className="gf-card gf-card-hover flex items-center gap-3 p-4 border-l-4"
        style={{ borderLeftColor: "#e14c4c" }}
      >
        <LifeBuoy size={22} className="shrink-0" style={{ color: "#e14c4c" }} />
        <div className="flex-1">
          <div className="font-semibold">In crisis right now?</div>
          <div className="text-sm gf-muted">
            Booking takes time. If you need immediate help, see crisis hotlines for your country.
          </div>
        </div>
        <ArrowRight size={16} className="opacity-60" />
      </Link>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, language, approach…"
            className="gf-input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "psychiatrist", "psychologist"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`gf-btn ${filter === f ? "gf-btn-primary" : "gf-btn-ghost"} capitalize`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`gf-btn ${verifiedOnly ? "gf-btn-primary" : "gf-btn-ghost"}`}
            title="Show only credential-verified professionals"
          >
            <BadgeCheck size={14} /> Verified
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gf-skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="gf-card p-10 text-center">
          <Heart className="mx-auto mb-3 opacity-50" size={28} />
          <div className="font-semibold mb-1">No professionals match your search.</div>
          <div className="gf-muted text-sm">
            Try clearing filters, or invite a professional you know to sign up.
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Link
              key={p.userId}
              href={`/dashboard/care/${p.userId}`}
              className="gf-card gf-card-hover gf-glow-hover relative p-5 block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-70 capitalize flex items-center gap-1.5">
                    {p.role}
                    {p.verified && (
                      <BadgeCheck size={14} style={{ color: "#6effc4" }} aria-label="Verified" />
                    )}
                  </div>
                  <div className="text-lg font-bold mt-0.5">{p.name}</div>
                </div>
                <ArrowRight size={18} className="mt-1 opacity-60 group-hover:opacity-100" />
              </div>
              {p.credentials && (
                <div className="mt-2 text-xs opacity-80 flex items-center gap-1.5">
                  <Briefcase size={12} /> {p.credentials}
                </div>
              )}
              {p.bio && (
                <p className="mt-3 text-sm leading-relaxed line-clamp-3 opacity-90">
                  {p.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                {p.yearsExperience !== null && (
                  <span className="gf-chip"><Clock size={10} /> {p.yearsExperience}y exp</span>
                )}
                {p.languages && (
                  <span className="gf-chip"><Globe size={10} /> {p.languages}</span>
                )}
                {p.feeText && <span className="gf-chip">{p.feeText}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
