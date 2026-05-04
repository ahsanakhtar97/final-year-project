"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Video, Loader2 } from "lucide-react";
import { getMyAppointments, type Appointment } from "@/app/actions/appointments";

/**
 * Jitsi video call page for a confirmed appointment.
 * Room name is deterministic: GrowFlow-appt-{appointmentId}
 * No API key required — Jitsi Meet is free and open.
 */
export default function CallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = Number(id);

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  // Deterministic room name based on appointment ID
  const roomName = `GrowFlow-appt-${appointmentId}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  useEffect(() => {
    (async () => {
      try {
        const all = await getMyAppointments();
        const found = all.find((a) => a.appointmentId === appointmentId) ?? null;
        if (!found || found.status !== "confirmed") {
          // Not a confirmed appointment — bounce back
          router.replace("/dashboard/appointments");
          return;
        }
        setAppt(found);
      } catch {
        router.replace("/dashboard/appointments");
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin opacity-60" />
      </div>
    );
  }

  if (!appt) return null;

  const when = new Date(appt.proposedAt);
  const otherParty = appt.professional?.name ?? appt.patient?.name ?? "Your session";

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/appointments" className="gf-btn gf-btn-ghost !p-2">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="gf-h2 flex items-center gap-2">
              <Video size={18} /> {otherParty}
            </h1>
            <p className="text-xs gf-muted">
              {when.toLocaleString()} · {appt.durationMinutes} min
            </p>
          </div>
        </div>
        <a
          href={jitsiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="gf-btn gf-btn-ghost text-xs"
        >
          Open in new tab ↗
        </a>
      </div>

      {/* Tips */}
      <div
        className="gf-card p-3 text-sm flex flex-wrap gap-4"
        style={{ background: "rgba(110,255,196,0.08)" }}
      >
        <span>🎤 Allow camera & microphone when prompted</span>
        <span>🔒 Room is private — only people with the link can join</span>
        <span>📋 Room name: <code className="opacity-70">{roomName}</code></span>
      </div>

      {/* Jitsi iframe */}
      <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 480 }}>
        {!iframeReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 gf-card">
            <Loader2 size={28} className="animate-spin opacity-60" />
            <p className="text-sm gf-muted">Loading video room…</p>
          </div>
        )}
        <iframe
          src={`${jitsiUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0 rounded-2xl"
          style={{ minHeight: 480, opacity: iframeReady ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setIframeReady(true)}
          title={`Video call with ${otherParty}`}
        />
      </div>
    </div>
  );
}
