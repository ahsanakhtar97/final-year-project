"use client";

import { useEffect, useState } from "react";
import {
  Users, ShieldCheck, CalendarDays, TrendingUp,
  CheckCircle, Clock, XCircle, AlertCircle, UserCheck, UserPlus,
} from "lucide-react";
import { getAdminStats, type AdminStats } from "@/app/actions/admin";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "#6effc4",
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        background: "rgba(15,36,31,0.7)",
        border: "1px solid rgba(110,255,196,0.12)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none" style={{ color: "#e7f7ee" }}>
          {value}
        </div>
        <div className="text-sm font-medium mt-1" style={{ color: "rgba(231,247,238,0.65)" }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: "rgba(231,247,238,0.35)" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const ROLE_COLORS = ["#6effc4", "#5cf2ff", "#b3c6ff", "#fbbf24"];
const APPT_COLORS: Record<string, string> = {
  pending: "#fbbf24",
  confirmed: "#6effc4",
  completed: "#5cf2ff",
  cancelled: "#e14c4c",
  declined: "#ff9090",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError("Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "rgba(231,247,238,0.4)" }}>Loading stats…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "#e14c4c" }}>{error || "No data."}</p>
      </div>
    );
  }

  const userRolePie = [
    { name: "Patients", value: stats.users.patients },
    { name: "Psychiatrists", value: stats.users.psychiatrists },
    { name: "Psychologists", value: stats.users.psychologists },
    { name: "Admins", value: stats.users.admins },
  ].filter((d) => d.value > 0);

  const apptBar = [
    { name: "Pending", value: stats.appointments.pending },
    { name: "Confirmed", value: stats.appointments.confirmed },
    { name: "Completed", value: stats.appointments.completed },
    { name: "Cancelled", value: stats.appointments.cancelled },
    { name: "Declined", value: stats.appointments.declined },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Lora', serif", color: "#aef0c9" }}
        >
          Platform Overview
        </h1>
        <p style={{ color: "rgba(231,247,238,0.45)", fontSize: 13, marginTop: 3 }}>
          Live snapshot of all GrowFlow activity
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.users.total} color="#6effc4" />
        <StatCard
          icon={UserPlus}
          label="New This Week"
          value={stats.growth.newSignups7Days}
          sub="last 7 days"
          color="#5cf2ff"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verified Doctors"
          value={stats.doctors.verified}
          sub={`${stats.doctors.pendingVerification} pending`}
          color="#b3c6ff"
        />
        <StatCard
          icon={CalendarDays}
          label="Total Appointments"
          value={stats.appointments.total}
          color="#fbbf24"
        />
      </div>

      {/* Appointment status row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Clock, label: "Pending", value: stats.appointments.pending, color: "#fbbf24" },
          { icon: CheckCircle, label: "Confirmed", value: stats.appointments.confirmed, color: "#6effc4" },
          { icon: UserCheck, label: "Completed", value: stats.appointments.completed, color: "#5cf2ff" },
          { icon: XCircle, label: "Cancelled", value: stats.appointments.cancelled, color: "#e14c4c" },
          { icon: AlertCircle, label: "Declined", value: stats.appointments.declined, color: "#ff9090" },
        ].map(({ icon: Icon, label, value, color }) => (
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User role distribution */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(15,36,31,0.7)", border: "1px solid rgba(110,255,196,0.12)" }}
        >
          <h2 className="text-sm font-bold mb-1 uppercase tracking-wider" style={{ color: "#6effc4" }}>
            User Distribution
          </h2>
          <p className="text-xs mb-4" style={{ color: "rgba(231,247,238,0.35)" }}>
            Breakdown by role
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRolePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {userRolePie.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f241f",
                    border: "1px solid rgba(110,255,196,0.2)",
                    borderRadius: 8,
                    color: "#e7f7ee",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {userRolePie.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }}
                />
                <span style={{ color: "rgba(231,247,238,0.6)" }}>
                  {item.name}: <strong style={{ color: "#e7f7ee" }}>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment status chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(15,36,31,0.7)", border: "1px solid rgba(110,255,196,0.12)" }}
        >
          <h2 className="text-sm font-bold mb-1 uppercase tracking-wider" style={{ color: "#6effc4" }}>
            Appointments by Status
          </h2>
          <p className="text-xs mb-4" style={{ color: "rgba(231,247,238,0.35)" }}>
            All-time breakdown
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apptBar} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,255,196,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(231,247,238,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(231,247,238,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f241f",
                    border: "1px solid rgba(110,255,196,0.2)",
                    borderRadius: 8,
                    color: "#e7f7ee",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {apptBar.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={APPT_COLORS[entry.name.toLowerCase()] ?? "#6effc4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor verification summary */}
      <div
        className="rounded-2xl p-6 flex flex-wrap items-center gap-6"
        style={{
          background: stats.doctors.pendingVerification > 0
            ? "rgba(251,191,36,0.06)"
            : "rgba(110,255,196,0.05)",
          border: `1px solid ${stats.doctors.pendingVerification > 0 ? "rgba(251,191,36,0.25)" : "rgba(110,255,196,0.15)"}`,
        }}
      >
        <ShieldCheck
          size={28}
          style={{ color: stats.doctors.pendingVerification > 0 ? "#fbbf24" : "#6effc4" }}
          className="shrink-0"
        />
        <div className="flex-1">
          <div className="font-semibold" style={{ color: "#e7f7ee" }}>
            {stats.doctors.pendingVerification > 0
              ? `${stats.doctors.pendingVerification} doctor${stats.doctors.pendingVerification > 1 ? "s" : ""} awaiting verification`
              : "All doctors are verified"}
          </div>
          <div className="text-sm mt-0.5" style={{ color: "rgba(231,247,238,0.45)" }}>
            {stats.doctors.verified} verified · {stats.doctors.pendingVerification} pending review
          </div>
        </div>
        {stats.doctors.pendingVerification > 0 && (
          <a
            href="/admin/doctors"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(251,191,36,0.15)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "#fbbf24",
            }}
          >
            Review now →
          </a>
        )}
      </div>
    </div>
  );
}
