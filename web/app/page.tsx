"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/header";
import { PipelineStatus } from "@/components/pipeline-status";
import { StatsCards } from "@/components/stats-cards";
import { LeadCard } from "@/components/lead-card";
import { ActivityLog } from "@/components/activity-log";
import type { Lead, PipelineStatus as PipelineStatusType } from "@/lib/types";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStatusType>({
    stage: "idle",
    started_at: null,
    message: "Ready to run",
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch {
      // silently fail on fetch errors
    }
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      setPipeline(data);
      return data;
    } catch {
      return pipeline;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeads();
    fetchPipeline();
  }, [fetchLeads, fetchPipeline]);

  const isRunning =
    pipeline.stage !== "idle" &&
    pipeline.stage !== "done" &&
    pipeline.stage !== "error";

  // Poll while running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(async () => {
        await fetchLeads();
        const status = await fetchPipeline();
        if (
          status.stage === "done" ||
          status.stage === "error" ||
          status.stage === "idle"
        ) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, fetchLeads, fetchPipeline]);

  const handleRunPipeline = async () => {
    try {
      await fetch("/api/pipeline", { method: "POST" });
      setPipeline({
        stage: "scouting",
        started_at: new Date().toISOString(),
        message: "Scouting founders from Product Hunt & Reddit...",
      });
    } catch {
      // handle error
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      await fetchLeads();
    } catch {
      // handle error
    }
  };

  const handleSkip = async (id: string) => {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "skip" }),
      });
      await fetchLeads();
    } catch {
      // handle error
    }
  };

  // Sort: lowest score first (highest priority)
  const sortedLeads = [...leads].sort(
    (a, b) => a.marketing_score - b.marketing_score
  );

  return (
    <div className="min-h-screen bg-gc-bg">
      <Header onRun={handleRunPipeline} isRunning={isRunning} />
      <PipelineStatus stage={pipeline.stage} message={pipeline.message} />

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <StatsCards leads={leads} />

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Lead cards */}
          <div className="space-y-4">
            {sortedLeads.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gc-muted text-lg">No leads yet</p>
                <p className="text-gc-muted/60 text-sm mt-1">
                  Click &quot;Run Pipeline&quot; to scout founders
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
      <footer className="border-t border-gc-muted/10 mt-12 py-4 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-xs text-gc-muted/50">
          <span>
            Built for{" "}
            <a
              href="https://crowdstake.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gc-accent/60 hover:text-gc-accent"
            >
              Crowdstake AI
            </a>{" "}
            at the Austin OpenClaw Hackathon
          </span>
          <span>Powered by OpenClaw + Claude</span>
        </div>
      </footer>
    </div>
  );
}
