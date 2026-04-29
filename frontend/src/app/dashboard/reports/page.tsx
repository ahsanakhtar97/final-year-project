"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import { toast } from "react-toastify";
import { getUserReports, Report } from "@/app/actions/reports";
import { getUserId } from "@/lib/utils";
import { Calendar, BrainCircuit } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function ReportsPage() {
  const { primaryAccent, isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const userId = getUserId();
      if (!userId) return;
      try {
        const res = await getUserReports(userId);
        setReports(res);
      } catch {
        toast.error("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-4xl gf-fade-up">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif", color: primaryAccent }}>
            Wellness Reports
          </h1>
          <p className="gf-muted mt-1 text-sm">
            AI-generated summaries of your weekly progress and mood.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold">
          <BrainCircuit size={16} /> AI Generated
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="gf-skeleton h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="gf-card p-12 text-center text-sm gf-muted border-dashed border-2">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          No reports generated yet. Keep tracking your habits and mood, and check back later!
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.reportId} className="gf-card overflow-hidden">
              <div className="px-6 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg" style={{ color: primaryAccent }}>
                    Weekly Summary
                  </h3>
                  <span className="text-xs font-semibold gf-muted uppercase tracking-wider">
                    {new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{report.summary}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
