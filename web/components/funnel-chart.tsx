"use client";

import type { Lead } from "@/lib/types";

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

export function FunnelChart({ leads }: { leads: Lead[] }) {
  const stages: FunnelStage[] = [
    {
      label: "Scouted",
      count: leads.length,
      color: "bg-gray-400",
    },
    {
      label: "Qualified",
      count: leads.filter((l) =>
        !["scouted", "skipped", "error"].includes(l.status)
      ).length,
      color: "bg-gc-amber",
    },
    {
      label: "Drafted",
      count: leads.filter((l) =>
        !["scouted", "qualified", "qualified-low", "skipped", "error"].includes(l.status)
      ).length,
      color: "bg-gc-red",
    },
    {
      label: "Sent",
      count: leads.filter((l) => l.sent_at != null).length,
      color: "bg-gc-purple",
    },
    {
      label: "Replied",
      count: leads.filter((l) => l.reply != null).length,
      color: "bg-gc-cyan",
    },
    {
      label: "Converted",
      count: leads.filter((l) => l.converted === true).length,
      color: "bg-gc-green",
    },
  ];

  const maxCount = Math.max(stages[0].count, 1);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 mb-6">
      <p className="text-xs font-medium text-gc-muted uppercase tracking-wide mb-3">
        Conversion Funnel
      </p>
      <div className="space-y-2">
        {stages.map((stage) => {
          const width = Math.max((stage.count / maxCount) * 100, 4);
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="text-xs text-gc-muted w-16 text-right shrink-0">
                {stage.label}
              </span>
              <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${width}%` }}
                >
                  {stage.count > 0 && (
                    <span className="text-[10px] font-bold text-white">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
