"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/types";

const dimensions = [
  { key: "positioning_clarity", label: "Positioning", weight: "25%" },
  { key: "cta_strength", label: "CTA", weight: "20%" },
  { key: "social_proof", label: "Social Proof", weight: "20%" },
  { key: "design_quality", label: "Design", weight: "15%" },
  { key: "copy_quality", label: "Copy", weight: "20%" },
] as const;

function getBarColor(score: number): string {
  if (score <= 3) return "bg-red-500";
  if (score <= 6) return "bg-amber-500";
  if (score <= 8) return "bg-emerald-500";
  return "bg-violet-500";
}

export function ScoreBreakdown({
  breakdown,
}: {
  breakdown: ScoreBreakdownType;
}) {
  return (
    <div className="space-y-1.5">
      {dimensions.map(({ key, label, weight }) => {
        const score = breakdown[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger className="text-xs text-gc-muted w-20 shrink-0 cursor-help truncate text-left">
                {label}
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {label} ({weight} weight)
                </p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(score)}`}
                style={{ width: `${score * 10}%` }}
              />
            </div>
            <span className="text-xs text-gc-muted w-4 text-right">
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
