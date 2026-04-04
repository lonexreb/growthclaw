"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "./score-gauge";
import { ScoreBreakdown } from "./score-breakdown";
import { OutreachDraft } from "./outreach-draft";
import { ExternalLink } from "lucide-react";
import type { Lead } from "@/lib/types";

const sourceConfig: Record<string, { label: string; color: string }> = {
  reddit: { label: "Reddit", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  producthunt: { label: "Product Hunt", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  indiehackers: { label: "Indie Hackers", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  scouted: { label: "Scouted", color: "bg-gc-cyan/20 text-gc-cyan border-gc-cyan/30" },
  qualified: { label: "Qualified", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "qualified-low": { label: "Low Priority", color: "bg-gc-accent/20 text-gc-accent border-gc-accent/30" },
  "outreach-drafted": { label: "Draft Ready", color: "bg-gc-purple/20 text-gc-purple border-gc-purple/30" },
  skipped: { label: "Skipped", color: "bg-gc-muted/20 text-gc-muted border-gc-muted/30" },
  error: { label: "Error", color: "bg-gc-red/20 text-gc-red border-gc-red/30" },
};

interface LeadCardProps {
  lead: Lead;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
}

export function LeadCard({ lead, onApprove, onSkip }: LeadCardProps) {
  const source = sourceConfig[lead.source] || { label: lead.source, color: "bg-gc-muted/20 text-gc-muted" };
  const status = statusConfig[lead.status] || { label: lead.status, color: "bg-gc-muted/20 text-gc-muted" };
  const hasScore = lead.marketing_score != null;
  const hasBreakdown = lead.score_breakdown != null;
  const hasGaps = lead.top_gaps && lead.top_gaps.length > 0;

  return (
    <Card className="bg-gc-bg-secondary/30 border-gc-muted/10 hover:border-gc-muted/20 transition-colors">
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
                <Badge className="bg-gc-red/20 text-gc-red border-gc-red/30">
                  HIGH PRIORITY
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gc-text flex items-center gap-2">
              <a
                href={lead.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gc-accent transition-colors"
              >
                {lead.product_name}
              </a>
              <ExternalLink className="h-3.5 w-3.5 text-gc-muted" />
            </h3>
            <p className="text-sm text-gc-muted">by {lead.founder_name}</p>
            <p className="text-sm text-gc-muted/80 mt-1 line-clamp-2">
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
                  <span className="text-gc-accent mt-1 shrink-0">&#8226;</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scouted-only state */}
        {!hasScore && (
          <div className="mt-4 py-3 text-center text-sm text-gc-muted/60">
            Awaiting scoring...
          </div>
        )}

        {/* Outreach — only after Stage 3 */}
        {lead.outreach_draft && (
          <div className="mt-4 pt-4 border-t border-gc-muted/10">
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
