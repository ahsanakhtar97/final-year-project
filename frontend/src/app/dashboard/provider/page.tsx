"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Calendar, Clock, Check, X, Send, Settings } from "lucide-react";
import {
  getMyAppointments,
  updateAppointment,
  type Appointment,
  type AppointmentStatus,
} from "@/app/actions/appointments";

const TONE: Record<AppointmentStatus, string> = {
  pending: "rgba(255,200,90,0.18)",
  confirmed: "rgba(110,255,196,0.18)",
  declined: "rgba(225,76,76,0.18)",
  completed: "rgba(110,200,255,0.16)",
  cancelled: "rgba(180,180,180,0.14)",
};

export default function ProviderHome() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await getMyAppointments()); }
    catch { toast.error("Couldn't load appointments."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function setStatus(id: number, status: AppointmentStatus) {
    try {
      await updateAppointment(id, { status });
      toast.info(`Marked ${status}.`);
      void load();
    } catch { toast.error("Couldn't update."); }
  }

  async function addNote(id: number) {
    const note = window.prompt("Add a note to the patient:");
    if (note == null) return;
    try {
      await updateAppointment(id, { professionalNote: note });
      toast.info("Note saved.");
      void load();
    } catch { toast.error("Couldn't save note."); }
  }

  const groups = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending");
    const upcoming = rows.filter((r) => r.status === "confirmed");
    const history = rows.filter((r) => ["declined", "completed", "cancelled"].includes(r.status));
    return { pending, upcoming, history };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Practice</h1>
          <p className="gf-muted">Pending requests, confirmed sessions, and history.</p>
        </div>
        <Link href="/dashboard/provider/profile" className="gf-btn gf-btn-ghost">
          <Settings size={14} /> Edit profile
        </Link>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="gf-skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <Bucket title="Pending requests" tint={TONE.pending} rows={groups.pending}>
            {(a) => (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setStatus(a.appointmentId, "confirmed")} className="gf-btn gf-btn-primary">
                  <Check size={14} /> Confirm
                </button>
                <button onClick={() => setStatus(a.appointmentId, "declined")} className="gf-btn gf-btn-ghost">
                  <X size={14} /> Decline
                </button>
                <button onClick={() => addNote(a.appointmentId)} className="gf-btn gf-btn-ghost">
                  <Send size={14} /> Note
                </button>
              </div>
            )}
          </Bucket>
          <Bucket title="Upcoming" tint={TONE.confirmed} rows={groups.upcoming}>
            {(a) => (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setStatus(a.appointmentId, "completed")} className="gf-btn gf-btn-primary">
                  <Check size={14} /> Mark completed
                </button>
                <button onClick={() => setStatus(a.appointmentId, "cancelled")} className="gf-btn gf-btn-ghost">
                  <X size={14} /> Cancel
                </button>
                <button onClick={() => addNote(a.appointmentId)} className="gf-btn gf-btn-ghost">
                  <Send size={14} /> Note
                </button>
              </div>
            )}
          </Bucket>
          <Bucket title="History" tint={TONE.completed} rows={groups.history}>
            {() => null}
          </Bucket>
          {rows.length === 0 && (
            <div className="gf-card p-10 text-center">
              <Calendar size={28} className="mx-auto mb-3 opacity-50" />
              <div className="font-semibold mb-1">No appointments yet.</div>
              <p className="gf-muted text-sm">When patients request you, they&apos;ll show up here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Bucket({
  title,
  tint,
  rows,
  children,
}: {
  title: string;
  tint: string;
  rows: Appointment[];
  children: (a: Appointment) => React.ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mt-6 mb-2">
        <span className="gf-chip" style={{ background: tint }}>{title}</span>
        <span className="text-xs opacity-60">{rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.map((a) => {
          const when = new Date(a.proposedAt);
          return (
            <div key={a.appointmentId} className="gf-card p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className="font-semibold">{a.patient?.name ?? "Patient"}</div>
                <div className="text-xs opacity-70">{a.patient?.email}</div>
                <div className="mt-1 flex items-center gap-3 text-sm opacity-85">
                  <span className="inline-flex items-center gap-1"><Calendar size={12} /> {when.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.durationMinutes}m</span>
                </div>
                {a.patientNote && (
                  <p className="mt-2 text-sm opacity-80">
                    <span className="font-semibold">Note from patient: </span>{a.patientNote}
                  </p>
                )}
                {a.professionalNote && (
                  <p className="mt-1 text-sm opacity-90">
                    <span className="font-semibold">Your reply: </span>{a.professionalNote}
                  </p>
                )}
              </div>
              <div className="self-center">{children(a)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
