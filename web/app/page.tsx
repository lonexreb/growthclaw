"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/header";
import { PipelineStatus } from "@/components/pipeline-status";
import { StatsCards } from "@/components/stats-cards";
import { LeadCard } from "@/components/lead-card";
import { ActivityLog } from "@/components/activity-log";
import { FunnelChart } from "@/components/funnel-chart";
import type { Lead, PipelineStatus as PipelineStatusType } from "@/lib/types";

type PipelineAction = "scout" | "follow-up" | "convert" | "success" | "full";

const AUTH_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET || ""}`,
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStatusType>({
    stage: "idle",
    started_at: null,
    message: "Ready to run",
    detail: "",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error(`Leads API returned ${res.status}`);
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline");
      if (!res.ok) throw new Error(`Pipeline API returned ${res.status}`);
      const data = await res.json();
      setPipeline(data);
      return data as PipelineStatusType;
    } catch (err) {
      console.error("Failed to fetch pipeline status:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchPipeline();
  }, [fetchLeads, fetchPipeline]);

  const isRunning =
    pipeline.stage !== "idle" &&
    pipeline.stage !== "done" &&
    pipeline.stage !== "error";

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(async () => {
        await fetchLeads();
        const status = await fetchPipeline();
        if (
          status &&
          (status.stage === "done" ||
            status.stage === "error" ||
            status.stage === "idle")
        ) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          await fetchLeads();
        }
      }, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, fetchLeads, fetchPipeline]);

  const handleRunPipeline = async (action: PipelineAction = "scout") => {
    setError(null);

    // For non-scout actions, call the dedicated API routes directly
    if (action === "follow-up" || action === "convert" || action === "success") {
      const endpoint = `/api/${action === "follow-up" ? "follow-up" : action === "convert" ? "convert" : "success"}`;
      try {
        const res = await fetch(endpoint, { method: "POST", headers: AUTH_HEADERS });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || `${action} failed`);
        } else {
          setError(null);
          await fetchLeads();
        }
      } catch (err) {
        setError(`${action} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    // Scout (default) — triggers the OpenClaw pipeline
    try {
      const res = await fetch("/api/pipeline", { method: "POST", headers: AUTH_HEADERS });
      if (res.status === 409) {
        setError("Pipeline is already running.");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to start pipeline (${res.status})`);
        return;
      }
      setPipeline({
        stage: "scouting",
        started_at: new Date().toISOString(),
        message: "Scouting founders from Product Hunt & Reddit...",
        detail: "Searching Reddit and Product Hunt...",
        progress: 5,
      });
    } catch (err) {
      setError(
        `Failed to connect to pipeline API: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (!res.ok) {
        setError("Failed to approve lead");
        return;
      }
      await fetchLeads();
    } catch (err) {
      setError(`Approve failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSkip = async (id: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify({ id, action: "skip" }),
      });
      if (!res.ok) {
        setError("Failed to skip lead");
        return;
      }
      await fetchLeads();
    } catch (err) {
      setError(`Skip failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const scoreA = a.marketing_score ?? 99;
    const scoreB = b.marketing_score ?? 99;
    return scoreA - scoreB;
  });

  return (
    <div className="min-h-screen">
      <Header onRun={handleRunPipeline} isRunning={isRunning} />
      <PipelineStatus
        stage={pipeline.stage}
        message={pipeline.message}
        detail={pipeline.detail}
        progress={pipeline.progress}
      />

      {/* Error bar */}
      {(error || pipeline.stage === "error") && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <p className="text-sm text-red-700">
              {error || pipeline.message}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <StatsCards leads={leads} />

        {/* Funnel chart — show when there are leads */}
        {leads.length > 0 && (
          <div className="mt-6">
            <FunnelChart leads={leads} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Lead cards */}
          <div className="space-y-4">
            {sortedLeads.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No leads yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click &quot;Scout Leads&quot; to find founders
                </p>
              </div>
            ) : (
              sortedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onApprove={handleApprove}
                  onSkip={handleSkip}
                />
              ))
            )}
          </div>

          {/* Activity log */}
          <div className="hidden xl:block">
            <div className="sticky top-6">
              <ActivityLog leads={leads} pipelineStage={pipeline.stage} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-12 py-4 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>
            Built for{" "}
            <a
              href="https://crowdstake.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gc-red/60 hover:text-gc-red"
            >
              Crowdstake AI
            </a>{" "}
            — Full-Cycle Autonomous Sales Engine
          </span>
          <span>Powered by OpenClaw + Claude</span>
        </div>
      </footer>
    </div>
  );
}
