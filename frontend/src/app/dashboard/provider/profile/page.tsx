"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function getAuthHeaders() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("accessToken");
    if (t) h["Authorization"] = `Bearer ${t}`;
  }
  return h;
}

interface MeResponse {
  userId: number;
  name: string;
  email: string;
  role: string;
  bio?: string | null;
  credentials?: string | null;
  languages?: string | null;
  feeText?: string | null;
  yearsExperience?: number | null;
}

export default function ProviderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [credentials, setCredentials] = useState("");
  const [languages, setLanguages] = useState("");
  const [feeText, setFeeText] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load profile");
        const me: MeResponse = await res.json();
        setUserId(me.userId);
        setName(me.name ?? "");
        setEmail(me.email ?? "");
        setBio(me.bio ?? "");
        setCredentials(me.credentials ?? "");
        setLanguages(me.languages ?? "");
        setFeeText(me.feeText ?? "");
        setYearsExperience(
          me.yearsExperience !== null && me.yearsExperience !== undefined
            ? String(me.yearsExperience)
            : "",
        );
      } catch {
        toast.error("Couldn't load your profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          bio: bio || undefined,
          credentials: credentials || undefined,
          languages: languages || undefined,
          feeText: feeText || undefined,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(String(err.message ?? err.error ?? "Couldn't save."));
      }
      toast.success("Profile updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="gf-skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Public profile</h1>
        <p className="gf-muted">This is what patients see when browsing Care.</p>
      </header>

      <form onSubmit={save} className="gf-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="gf-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Email</label>
            <input value={email} disabled className="gf-input opacity-70" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Credentials</label>
          <input value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="MBBS, FCPS (Psychiatry)" className="gf-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Years of experience</label>
            <input type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="gf-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Languages</label>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Urdu" className="gf-input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Fee (informational)</label>
          <input value={feeText} onChange={(e) => setFeeText(e.target.value)} placeholder="PKR 5,000 / session" className="gf-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Short bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="gf-textarea" />
        </div>
        <button type="submit" disabled={saving} className="gf-btn gf-btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
