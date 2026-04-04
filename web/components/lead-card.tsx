"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "./score-gauge";
import { ScoreBreakdown } from "./score-breakdown";
import { OutreachDraft } from "./outreach-draft";
import { ExternalLink } from "lucide-react";
import type { Lead } from "@/lib/types";

const sourceConfig: Record<string, { label: string; color: string }> = {
  reddit: { label: "Reddit", color: "bg-orange-50 text-orange-700 border-orange-200" },
  producthunt: { label: "Product Hunt", color: "bg-red-50 text-red-700 border-red-200" },
  indiehackers: { label: "Indie Hackers", color: "bg-blue-50 text-blue-700 border-blue-200" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  scouted: { label: "Scouted", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  qualified: { label: "Qualified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "qualified-low": { label: "Low Priority", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "outreach-drafted": { label: "Draft Ready", color: "bg-violet-50 text-violet-700 border-violet-200" },
  skipped: { label: "Skipped", color: "bg-gray-100 text-gray-500 border-gray-200" },
  error: { label: "Error", color: "bg-red-50 text-red-700 border-red-200" },
};

interface LeadCardProps {
  lead: Lead;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
}

export function LeadCard({ lead, onApprove, onSkip }: LeadCardProps) {
  const source = sourceConfig[lead.source] || { label: lead.source, color: "bg-gray-100 text-gray-600" };
  const status = statusConfig[lead.status] || { label: lead.status, color: "bg-gray-100 text-gray-600" };
  const hasScore = lead.marketing_score != null;
  const hasBreakdown = lead.score_breakdown != null;
  const hasGaps = lead.top_gaps && lead.top_gaps.length > 0;

  return (
    <Card className="bg-white border-gray-200/80 hover:border-gc-red/30 hover:shadow-md hover:shadow-red-50 transition-all">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={source.color}>
                {source.label}
              </Badge>
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
              {hasScore && lead.marketing_score! <= 5 && (
                <Badge className="bg-red-600 text-white border-red-600">
                  HIGH PRIORITY
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gc-text flex items-center gap-2">
              <a
                href={lead.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gc-red transition-colors"
              >
                {lead.product_name}
              </a>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </h3>
            <p className="text-sm text-gc-muted">by {lead.founder_name}</p>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {lead.description}
            </p>
          </div>
          {hasScore && <ScoreGauge score={lead.marketing_score!} />}
        </div>

        {/* Score breakdown — only after Stage 2 */}
        {hasBreakdown && (
          <div className="mt-4">
            <ScoreBreakdown breakdown={lead.score_breakdown!} />
          </div>
        )}

        {/* Gaps — only after Stage 2 */}
        {hasGaps && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gc-muted uppercase tracking-wide mb-1.5">
              Marketing Gaps
            </p>
            <ul className="space-y-1">
              {lead.top_gaps!.map((gap, i) => (
                <li
                  key={`${lead.id}-gap-${i}`}
                  className="text-sm text-gc-text/80 flex items-start gap-2"
                >
                  <span className="text-gc-red mt-1 shrink-0">&#8226;</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scouted-only state — no score yet */}
        {!hasScore && (
          <div className="mt-4 py-3 text-center text-sm text-gray-400">
            Awaiting scoring...
          </div>
        )}

        {/* Has score but no detailed breakdown — show compact summary */}
        {hasScore && !hasBreakdown && !hasGaps && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <div
              className={`w-2 h-2 rounded-full ${
                lead.marketing_score! <= 3
                  ? "bg-red-500"
                  : lead.marketing_score! <= 6
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            <span>
              Score {lead.marketing_score}/10 — detailed breakdown not available
            </span>
          </div>
        )}

        {/* Outreach — only after Stage 3 */}
        {lead.outreach_draft && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <OutreachDraft
              draft={lead.outreach_draft}
              status={lead.outreach_status || "drafted"}
              onApprove={() => onApprove(lead.id)}
              onSkip={() => onSkip(lead.id)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
