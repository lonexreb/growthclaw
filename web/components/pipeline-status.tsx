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
    <div className="w-full bg-gc-red-light/50 border-b border-red-100 px-6 py-3">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          {/* Steps */}
          <div className="flex items-center gap-0 flex-1">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isComplete = currentIdx > i;
              const isCurrent = currentIdx === i;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step circle */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? "bg-gc-red text-white"
                          : isCurrent
                            ? "bg-red-50 text-gc-red border-2 border-gc-red"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                      {isCurrent && isRunning && (
                        <span className="absolute inset-0 rounded-full border-2 border-gc-red animate-ping opacity-30" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isComplete || isCurrent
                          ? "text-gc-text"
                          : "text-gray-400"
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
                            ? "bg-gc-red"
                            : "bg-gray-200"
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
            <p className="text-xs text-gc-red font-medium animate-pulse shrink-0">
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
