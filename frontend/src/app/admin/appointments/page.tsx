"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft, ChevronRight, Trash2,
  ShieldAlert, Loader2, RefreshCw, CalendarDays,
} from "lucide-react";
import {
  getAdminAppointments,
  deleteAdminAppointment,
  type AdminAppointment,
  type PaginatedAppointments,
} from "@/app/actions/admin";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
  confirmed: { bg: "rgba(110,255,196,0.12)", color: "#6effc4" },
  completed: { bg: "rgba(92,242,255,0.12)",  color: "#5cf2ff" },
  cancelled: { bg: "rgba(225,76,76,0.12)",   color: "#e14c4c" },
  declined:  { bg: "rgba(255,144,144,0.12)", color: "#ff9090" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "rgba(255,255,255,0.08)", color: "#e7f7ee" };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

const STATUSES = ["", "pending", "confirmed", "completed", "cancelled", "declined"];

export default function AdminAppointmentsPage() {
  const [data, setData] = useState<PaginatedAppointments | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminAppointments({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setData(res);
    } catch {
      showToast("Failed to load appointments.", "err");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAdminAppointment(deleteId);
      showToast("Appointment deleted.");
      setDeleteId(null);
      load();
    } catch {
      showToast("Failed to delete appointment.", "err");
    } finally {
      setDeleting(false);
    }
  }

  const inputStyle = {
    background: "rgba(110,255,196,0.05)",
    border: "1.5px solid rgba(110,255,196,0.18)",
    color: "#e7f7ee",
    outline: "none",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{
            background: toast.type === "ok" ? "rgba(110,255,196,0.15)" : "rgba(225,76,76,0.15)",
            border: `1px solid ${toast.type === "ok" ? "rgba(110,255,196,0.4)" : "rgba(225,76,76,0.4)"}`,
            color: toast.type === "ok" ? "#6effc4" : "#ff9090",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif", color: "#aef0c9" }}>
            Appointments
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
            {data ? `${data.total} appointments total` : "Loading…"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ background: "rgba(110,255,196,0.08)", border: "1px solid rgba(110,255,196,0.15)", color: "#6effc4" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const label = s || "All";
          const style = s ? STATUS_STYLE[s] : { bg: "rgba(110,255,196,0.12)", color: "#6effc4" };
          const isActive = statusFilter === s;
          return (
            <button
              key={label}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={{
                background: isActive ? style.bg : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? style.color + "66" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? style.color : "rgba(231,247,238,0.45)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(110,255,196,0.12)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(110,255,196,0.06)", borderBottom: "1px solid rgba(110,255,196,0.1)" }}>
                {["#", "Patient", "Doctor", "Scheduled", "Duration", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "rgba(231,247,238,0.45)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: "rgba(231,247,238,0.3)" }}>
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    Loading…
                  </td>
                </tr>
              ) : !data?.appointments.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: "rgba(231,247,238,0.3)" }}>
                    <CalendarDays size={28} className="mx-auto mb-2 opacity-25" />
                    No appointments found.
                  </td>
                </tr>
              ) : (
                data.appointments.map((a: AdminAppointment, idx) => (
                  <tr
                    key={a.appointmentId}
                    style={{
                      borderBottom: "1px solid rgba(110,255,196,0.06)",
                      background: idx % 2 === 0 ? "rgba(15,36,31,0.5)" : "rgba(11,29,24,0.3)",
                    }}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(231,247,238,0.35)" }}>
                      #{a.appointmentId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "#e7f7ee" }}>
                        {a.patient?.name ?? `Patient #${a.patientId}`}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
                        {a.patient?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "#e7f7ee" }}>
                        {a.professional?.name ?? `Dr. #${a.professionalId}`}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
                        {a.professional?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs" style={{ color: "rgba(231,247,238,0.7)" }}>
                        {new Date(a.proposedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
                        {new Date(a.proposedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(231,247,238,0.5)" }}>
                      {a.durationMinutes} min
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(a.appointmentId)}
                        title="Delete appointment"
                        className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors"
                        style={{ color: "#e14c4c" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "rgba(110,255,196,0.1)" }}
          >
            <span className="text-xs" style={{ color: "rgba(231,247,238,0.35)" }}>
              Page {data.page} of {data.pages} · {data.total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ background: "#0f241f", border: "1px solid rgba(225,76,76,0.3)" }}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={22} style={{ color: "#e14c4c" }} />
              <h2 className="font-bold text-lg" style={{ color: "#e7f7ee" }}>Delete appointment?</h2>
            </div>
            <p className="text-sm" style={{ color: "rgba(231,247,238,0.55)" }}>
              This permanently removes appointment #{deleteId} from the platform. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "#e7f7ee" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "rgba(225,76,76,0.2)", border: "1px solid rgba(225,76,76,0.4)", color: "#ff9090" }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
