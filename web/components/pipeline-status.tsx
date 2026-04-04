"use client";

import { Check, Search, BarChart3, FileText, Sparkles } from "lucide-react";
import type { PipelineStage } from "@/lib/types";

const steps = [
  { id: "scouting", label: "Scout", icon: Search },
  { id: "scoring", label: "Score", icon: BarChart3 },
  { id: "drafting", label: "Draft", icon: FileText },
  { id: "done", label: "Done", icon: Sparkles },
] as const;

const stageOrder: Record<string, number> = {
  idle: -1,
  scouting: 0,
  scoring: 1,
  drafting: 2,
  done: 3,
  error: -1,
};

export function PipelineStatus({
  stage,
  message,
}: {
  stage: PipelineStage;
  message: string;
}) {
  const currentIdx = stageOrder[stage] ?? -1;
  const isRunning =
    stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <div className="w-full bg-gc-bg-secondary/30 border-b border-gc-muted/10 px-6 py-3">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          {/* Steps */}
          <div className="flex items-center gap-0 flex-1">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isComplete = currentIdx > i;
              const isCurrent = currentIdx === i;
              const isFuture = currentIdx < i;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step circle */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? "bg-gc-accent text-white"
                          : isCurrent
                            ? "bg-gc-accent/20 text-gc-accent border-2 border-gc-accent"
                            : "bg-gc-bg-secondary text-gc-muted border border-gc-muted/30"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                      {isCurrent && isRunning && (
                        <span className="absolute inset-0 rounded-full border-2 border-gc-accent animate-ping opacity-30" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isComplete || isCurrent
                          ? "text-gc-text"
                          : "text-gc-muted/50"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div
                        className={`h-0.5 rounded-full transition-all ${
                          currentIdx > i
                            ? "bg-gc-accent"
                            : "bg-gc-muted/20"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status message */}
          {isRunning && (
            <p className="text-xs text-gc-muted animate-pulse shrink-0">
              {message}
            </p>
          )}
          {stage === "error" && (
            <p className="text-xs text-gc-red shrink-0">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
