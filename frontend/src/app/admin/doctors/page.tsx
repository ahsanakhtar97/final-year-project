"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, ShieldX, UserCheck, Clock,
  Stethoscope, Loader2, RefreshCw,
} from "lucide-react";
import {
  getAdminProfessionals,
  verifyProfessional,
  type AdminUser,
} from "@/app/actions/admin";

function ProfCard({
  pro,
  onVerify,
  loading,
}: {
  pro: AdminUser;
  onVerify: (id: number, verified: boolean) => void;
  loading: boolean;
}) {
  const isPending = !pro.verified;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "rgba(15,36,31,0.7)",
        border: `1px solid ${isPending ? "rgba(251,191,36,0.25)" : "rgba(110,255,196,0.15)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 text-lg font-bold"
          style={{
            background: isPending ? "rgba(251,191,36,0.12)" : "rgba(110,255,196,0.12)",
            color: isPending ? "#fbbf24" : "#6effc4",
          }}
        >
          {pro.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ color: "#e7f7ee" }}>{pro.name}</div>
          <div className="text-sm" style={{ color: "rgba(231,247,238,0.45)" }}>{pro.email}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Stethoscope size={12} style={{ color: "rgba(231,247,238,0.35)" }} />
            <span className="text-xs capitalize" style={{ color: "rgba(231,247,238,0.5)" }}>
              {pro.role}
            </span>
            {pro.yearsExperience && (
              <>
                <span style={{ color: "rgba(231,247,238,0.2)" }}>·</span>
                <span className="text-xs" style={{ color: "rgba(231,247,238,0.5)" }}>
                  {pro.yearsExperience} yr{pro.yearsExperience !== 1 ? "s" : ""} exp
                </span>
              </>
            )}
          </div>
        </div>
        {/* Verification status chip */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{
            background: isPending ? "rgba(251,191,36,0.12)" : "rgba(110,255,196,0.12)",
            color: isPending ? "#fbbf24" : "#6effc4",
          }}
        >
          {isPending ? <Clock size={11} /> : <ShieldCheck size={11} />}
          {isPending ? "Pending" : "Verified"}
        </div>
      </div>

      {/* Profile details */}
      <div className="space-y-2 text-sm">
        {pro.credentials && (
          <div>
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(231,247,238,0.35)" }}>
              Credentials
            </span>
            <p className="mt-0.5" style={{ color: "rgba(231,247,238,0.7)" }}>{pro.credentials}</p>
          </div>
        )}
        {pro.bio && (
          <div>
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(231,247,238,0.35)" }}>
              Bio
            </span>
            <p
              className="mt-0.5 line-clamp-3"
              style={{ color: "rgba(231,247,238,0.6)", lineHeight: 1.5 }}
            >
              {pro.bio}
            </p>
          </div>
        )}
        {pro.languages && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(231,247,238,0.35)" }}>
              Languages:
            </span>
            <span className="text-xs" style={{ color: "rgba(231,247,238,0.55)" }}>{pro.languages}</span>
          </div>
        )}
        {pro.feeText && (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(231,247,238,0.35)" }}>
              Fee:
            </span>
            <span className="text-xs" style={{ color: "rgba(231,247,238,0.55)" }}>{pro.feeText}</span>
          </div>
        )}
        <div
          className="text-xs"
          style={{ color: "rgba(231,247,238,0.3)" }}
        >
          Joined {new Date(pro.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isPending ? (
          <button
            onClick={() => onVerify(pro.userId, true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(110,255,196,0.15)",
              border: "1px solid rgba(110,255,196,0.3)",
              color: "#6effc4",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Verify Doctor
          </button>
        ) : (
          <button
            onClick={() => onVerify(pro.userId, false)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(225,76,76,0.1)",
              border: "1px solid rgba(225,76,76,0.25)",
              color: "#e14c4c",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldX size={14} />}
            Revoke Verification
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [professionals, setProfessionals] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminProfessionals();
      setProfessionals(data);
    } catch {
      showToast("Failed to load professionals.", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(id: number, verified: boolean) {
    setActionLoading(id);
    try {
      const res = await verifyProfessional(id, verified);
      showToast(res.message);
      setProfessionals((prev) =>
        prev.map((p) => (p.userId === id ? { ...p, verified } : p))
      );
    } catch {
      showToast("Action failed.", "err");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = professionals.filter((p) => {
    if (filter === "pending") return !p.verified;
    if (filter === "verified") return p.verified;
    return true;
  });

  const pendingCount = professionals.filter((p) => !p.verified).length;
  const verifiedCount = professionals.filter((p) => p.verified).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
            Doctor Verification
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
            Review and approve psychiatrist & psychologist applications
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: "rgba(110,255,196,0.08)",
            border: "1px solid rgba(110,255,196,0.15)",
            color: "#6effc4",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: professionals.length, color: "#b3c6ff", icon: Stethoscope },
          { label: "Pending", value: pendingCount, color: "#fbbf24", icon: Clock },
          { label: "Verified", value: verifiedCount, color: "#6effc4", icon: UserCheck },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(15,36,31,0.7)", border: `1px solid ${color}22` }}
          >
            <Icon size={18} className="mx-auto mb-2" style={{ color }} />
            <div className="text-xl font-bold" style={{ color: "#e7f7ee" }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(231,247,238,0.45)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "verified"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
            style={{
              background: filter === f ? "rgba(110,255,196,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter === f ? "rgba(110,255,196,0.35)" : "rgba(255,255,255,0.08)"}`,
              color: filter === f ? "#6effc4" : "rgba(231,247,238,0.5)",
            }}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(251,191,36,0.25)", color: "#fbbf24" }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={22} className="animate-spin" style={{ color: "rgba(231,247,238,0.3)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(15,36,31,0.5)", border: "1px solid rgba(110,255,196,0.08)" }}
        >
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
          <p style={{ color: "rgba(231,247,238,0.4)" }}>
            {filter === "pending" ? "No professionals awaiting verification." : "No professionals found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((pro) => (
            <ProfCard
              key={pro.userId}
              pro={pro}
              onVerify={handleVerify}
              loading={actionLoading === pro.userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
