"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Search, BarChart3, FileText } from "lucide-react";
import type { Lead, PipelineStage } from "@/lib/types";

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: "scout" | "score" | "draft";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

const typeConfig = {
  scout: { icon: Search, color: "bg-gc-red" },
  score: { icon: BarChart3, color: "bg-gc-amber" },
  draft: { icon: FileText, color: "bg-gc-purple" },
};

export function ActivityLog({
  leads,
  pipelineStage,
}: {
  leads: Lead[];
  pipelineStage: PipelineStage;
}) {
  const entries: LogEntry[] = [];
  for (const lead of leads) {
    if (lead.found_at) {
      entries.push({
        id: `${lead.id}-scout-${lead.found_at}`,
        time: lead.found_at,
        message: `Scouted ${lead.product_name} from ${lead.source}`,
        type: "scout",
      });
    }
    if (lead.enriched_at) {
      entries.push({
        id: `${lead.id}-score-${lead.enriched_at}`,
        time: lead.enriched_at,
        message: `Scored ${lead.product_name}: ${lead.marketing_score ?? "?"}/10`,
        type: "score",
      });
    }
    if (lead.drafted_at) {
      entries.push({
        id: `${lead.id}-draft-${lead.drafted_at}`,
        time: lead.drafted_at,
        message: `Drafted outreach for ${lead.product_name}`,
        type: "draft",
      });
    }
  }

  entries.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  const isRunning =
    pipelineStage !== "idle" &&
    pipelineStage !== "done" &&
    pipelineStage !== "error";

  return (
    <Card className="bg-white border-gray-200/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gc-muted flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        <div className="space-y-3">
          {/* Current stage indicator */}
          {isRunning && (
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-gc-red animate-pulse shrink-0" />
              <div>
                <p className="text-sm text-gc-red font-medium">
                  {pipelineStage === "scouting" && "Scouting founders..."}
                  {pipelineStage === "scoring" && "Scoring websites..."}
                  {pipelineStage === "drafting" && "Drafting outreach..."}
                </p>
                <p className="text-xs text-gc-muted">In progress</p>
              </div>
            </div>
          )}

          {entries.length === 0 && !isRunning && (
            <p className="text-sm text-gray-400 text-center py-8">
              No activity yet. Run the pipeline to start.
            </p>
          )}
          {entries.map((entry) => {
            const config = typeConfig[entry.type];
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div
                  className={`mt-1 w-1.5 h-1.5 rounded-full ${config.color} shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gc-text/80 leading-snug">
                    {entry.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(entry.time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
