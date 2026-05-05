"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { ArrowLeft, Calendar, Clock, Globe, Briefcase, Send, BadgeCheck } from "lucide-react";
import { getProfessional, type PublicProfessional } from "@/app/actions/professionals";
import { createAppointment } from "@/app/actions/appointments";

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const [pro, setPro] = useState<PublicProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(50);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    (async () => {
      try { setPro(await getProfessional(id)); }
      catch { toast.error("Couldn't load this professional."); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Pick a date and time first.");
      return;
    }
    const proposedAt = new Date(`${date}T${time}`).toISOString();
    setSubmitting(true);
    try {
      await createAppointment({
        professionalId: id,
        proposedAt,
        durationMinutes: duration,
        patientNote: note || undefined,
      });
      toast.success("Request sent. You'll see it under Appointments.");
      router.push("/dashboard/appointments");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Couldn't book — try a different time.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="gf-skeleton h-64 rounded-2xl" />;
  if (!pro) return (
    <div className="gf-card p-8 text-center">
      <div className="font-semibold mb-1">Professional not found.</div>
      <Link href="/dashboard/care" className="gf-btn gf-btn-ghost mt-4 inline-flex">
        <ArrowLeft size={14} /> Back to Care
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/dashboard/care" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
        <ArrowLeft size={14} /> Back to Care
      </Link>

      <header className="gf-card p-6">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-70 capitalize flex items-center gap-1.5">
          {pro.role}
          {pro.verified && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(110,255,196,0.18)", color: "#6effc4" }}
            >
              <BadgeCheck size={12} /> VERIFIED
            </span>
          )}
        </div>
        <h1 className="gf-h1 mt-1" style={{ fontFamily: "'Lora', serif" }}>{pro.name}</h1>
        {pro.credentials && (
          <div className="mt-2 text-sm opacity-80 flex items-center gap-1.5">
            <Briefcase size={14} /> {pro.credentials}
          </div>
        )}
        {pro.bio && <p className="mt-4 leading-relaxed">{pro.bio}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {pro.yearsExperience !== null && (
            <span className="gf-chip"><Clock size={12} /> {pro.yearsExperience}y exp</span>
          )}
          {pro.languages && <span className="gf-chip"><Globe size={12} /> {pro.languages}</span>}
          {pro.feeText && <span className="gf-chip">{pro.feeText}</span>}
        </div>
      </header>

      {!pro.verified ? (
        <div
          className="gf-card p-6 flex items-start gap-4"
          style={{ borderLeft: "4px solid #fbbf24", background: "rgba(251,191,36,0.06)" }}
        >
          <BadgeCheck size={22} className="shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
          <div>
            <div className="font-semibold text-base mb-1">Not yet accepting appointments</div>
            <p className="gf-muted text-sm leading-relaxed">
              {pro.name.split(" ")[0]}&apos;s credentials are currently being reviewed by our admin team.
              Once verified, you&apos;ll be able to book a session with them. Check back soon.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="gf-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} />
            <h2 className="gf-h2">Request an appointment</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="gf-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="gf-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Duration (min)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="gf-select">
                {[30, 45, 50, 60, 90].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">A note for {pro.name.split(" ")[0]} (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything you'd like them to know up front."
              className="gf-textarea"
            />
          </div>
          <button type="submit" disabled={submitting} className="gf-btn gf-btn-primary">
            <Send size={14} /> {submitting ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
    </div>
  );
}
