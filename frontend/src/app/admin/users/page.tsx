"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Trash2,
  ShieldAlert, UserCog, Check, X, Loader2,
} from "lucide-react";
import {
  getAdminUsers, updateAdminUser, deleteAdminUser,
  type AdminUser, type PaginatedUsers,
} from "@/app/actions/admin";

const ROLES = ["", "patient", "psychiatrist", "psychologist", "admin"];

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  patient: { bg: "rgba(110,255,196,0.12)", color: "#6effc4", label: "Patient" },
  psychiatrist: { bg: "rgba(92,242,255,0.12)", color: "#5cf2ff", label: "Psychiatrist" },
  psychologist: { bg: "rgba(179,198,255,0.12)", color: "#b3c6ff", label: "Psychologist" },
  admin: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Admin" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_BADGE[role] ?? { bg: "rgba(255,255,255,0.08)", color: "#e7f7ee", label: role };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
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
      const res = await getAdminUsers({ search: search || undefined, role: roleFilter || undefined, page, limit: 15 });
      setData(res);
    } catch {
      showToast("Failed to load users.", "err");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  async function saveRole(userId: number) {
    setSaving(true);
    try {
      await updateAdminUser(userId, { role: editRole as any });
      showToast("Role updated.");
      setEditingId(null);
      load();
    } catch {
      showToast("Failed to update role.", "err");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteId);
      showToast("User deleted.");
      setDeleteId(null);
      load();
    } catch {
      showToast("Failed to delete user.", "err");
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
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(231,247,238,0.4)" }}>
            {data ? `${data.total} users total` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            style={inputStyle}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={inputStyle}
        >
          <option value="">All roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r} style={{ background: "#0f241f" }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
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
                {["#", "Name", "Email", "Role", "Level / XP", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
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
              ) : !data?.users.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: "rgba(231,247,238,0.3)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                data.users.map((u: AdminUser, idx) => (
                  <tr
                    key={u.userId}
                    style={{
                      borderBottom: "1px solid rgba(110,255,196,0.06)",
                      background: idx % 2 === 0 ? "rgba(15,36,31,0.5)" : "rgba(11,29,24,0.3)",
                    }}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(231,247,238,0.35)" }}>
                      {u.userId}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#e7f7ee" }}>
                      {u.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: "rgba(231,247,238,0.55)" }}>
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.userId ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="rounded-lg px-2 py-1 text-xs"
                            style={inputStyle}
                          >
                            {ROLES.filter(Boolean).map((r) => (
                              <option key={r} value={r} style={{ background: "#0f241f" }}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveRole(u.userId)}
                            disabled={saving}
                            className="p-1 rounded-lg transition-colors hover:bg-green-500/20"
                            style={{ color: "#6effc4" }}
                          >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded-lg transition-colors hover:bg-red-500/20"
                            style={{ color: "#e14c4c" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(231,247,238,0.5)" }}>
                      Lv {u.level} · {u.xp} XP
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(231,247,238,0.4)" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingId(u.userId); setEditRole(u.role); }}
                          title="Change role"
                          className="p-1.5 rounded-lg hover:bg-blue-500/15 transition-colors"
                          style={{ color: "#b3c6ff" }}
                        >
                          <UserCog size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.userId)}
                          title="Delete user"
                          className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors"
                          style={{ color: "#e14c4c" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              Page {data.page} of {data.pages}
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
            style={{
              background: "#0f241f",
              border: "1px solid rgba(225,76,76,0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={22} style={{ color: "#e14c4c" }} />
              <h2 className="font-bold text-lg" style={{ color: "#e7f7ee" }}>Delete user?</h2>
            </div>
            <p className="text-sm" style={{ color: "rgba(231,247,238,0.55)" }}>
              This permanently deletes the account and all associated data. This action cannot be undone.
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
