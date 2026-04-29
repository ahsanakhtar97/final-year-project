"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Calendar, Clock, X, Briefcase, Plus } from "lucide-react";
import {
  getMyAppointments,
  updateAppointment,
  type Appointment,
  type AppointmentStatus,
} from "@/app/actions/appointments";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "rgba(255,200,90,0.18)",
  confirmed: "rgba(110,255,196,0.18)",
  declined: "rgba(225,76,76,0.18)",
  completed: "rgba(110,200,255,0.16)",
  cancelled: "rgba(180,180,180,0.14)",
};

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try { setRows(await getMyAppointments()); }
    catch { toast.error("Couldn't load appointments."); }
    finally { setLoading(false); }
  }

  async function cancel(id: number) {
    try {
      await updateAppointment(id, { status: "cancelled" });
      toast.info("Appointment cancelled.");
      void load();
    } catch { toast.error("Couldn't cancel."); }
  }

  const grouped = useMemo(() => {
    const upcoming = rows.filter((r) => ["pending", "confirmed"].includes(r.status));
    const past = rows.filter((r) => !["pending", "confirmed"].includes(r.status));
    return { upcoming, past };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Appointments</h1>
          <p className="gf-muted">Your upcoming requests and past sessions.</p>
        </div>
        <Link href="/dashboard/care" className="gf-btn gf-btn-primary">
          <Plus size={14} /> Book new
        </Link>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gf-skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="gf-card p-10 text-center">
          <Calendar size={28} className="mx-auto mb-3 opacity-50" />
          <div className="font-semibold mb-1">No appointments yet.</div>
          <Link href="/dashboard/care" className="gf-btn gf-btn-primary mt-4 inline-flex">
            Browse professionals
          </Link>
        </div>
      ) : (
        <>
          <Section title="Upcoming" rows={grouped.upcoming} onCancel={cancel} />
          <Section title="Past" rows={grouped.past} onCancel={cancel} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  onCancel,
}: {
  title: string;
  rows: Appointment[];
  onCancel: (id: number) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="gf-h2 mt-6">{title}</h2>
      <div className="space-y-2">
        {rows.map((a) => {
          const when = new Date(a.proposedAt);
          const cancellable = ["pending", "confirmed"].includes(a.status);
          return (
            <div key={a.appointmentId} className="gf-card p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="gf-chip capitalize"
                    style={{ background: STATUS_TONE[a.status] }}
                  >
                    {STATUS_LABELS[a.status]}
                  </span>
                  <span className="text-xs opacity-70 capitalize">
                    {a.professional?.role ?? "professional"}
                  </span>
                </div>
                <div className="mt-1 font-semibold">
                  {a.professional?.name ?? "Professional"}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm opacity-85">
                  <span className="inline-flex items-center gap-1"><Calendar size={12} /> {when.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.durationMinutes}m</span>
                </div>
                {a.patientNote && (
                  <p className="mt-2 text-sm opacity-80">
                    <span className="font-semibold">Your note: </span>
                    {a.patientNote}
                  </p>
                )}
                {a.professionalNote && (
                  <p className="mt-1 text-sm opacity-90 flex items-start gap-1">
                    <Briefcase size={12} className="mt-0.5" />
                    <span>{a.professionalNote}</span>
                  </p>
                )}
              </div>
              {cancellable && (
                <button
                  type="button"
                  onClick={() => onCancel(a.appointmentId)}
                  className="gf-btn gf-btn-ghost"
                  aria-label="Cancel"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
