"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "./score-gauge";
import { ScoreBreakdown } from "./score-breakdown";
import { OutreachDraft } from "./outreach-draft";
import { FollowUpTimeline } from "./follow-up-timeline";
import { ExternalLink, Heart, AlertTriangle, TrendingUp } from "lucide-react";
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
  "outreach-sent": { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "follow-up-1": { label: "Follow-Up 1", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "follow-up-2": { label: "Follow-Up 2", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "follow-up-3": { label: "Follow-Up 3", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "reply-received": { label: "Replied", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", color: "bg-gray-100 text-gray-500 border-gray-200" },
  "no-response": { label: "No Response", color: "bg-gray-100 text-gray-500 border-gray-200" },
  "meeting-booked": { label: "Meeting", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "trial-started": { label: "Trial", color: "bg-violet-50 text-violet-700 border-violet-200" },
  onboarding: { label: "Onboarding", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  converted: { label: "Converted", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  "expansion-ready": { label: "Expansion", color: "bg-blue-50 text-blue-700 border-blue-200" },
  churning: { label: "Churning", color: "bg-red-50 text-red-700 border-red-200" },
  churned: { label: "Churned", color: "bg-gray-100 text-gray-500 border-gray-200" },
  stalled: { label: "Stalled", color: "bg-gray-100 text-gray-500 border-gray-200" },
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
  const hasFollowUps = lead.sent_at != null;
  const hasHealth = lead.health_score != null;

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
              {lead.converted && (
                <Badge className="bg-emerald-600 text-white border-emerald-600">
                  {lead.plan?.toUpperCase()} — ${lead.mrr}/mo
                </Badge>
              )}
              {lead.churn_risk === "high" || lead.churn_risk === "critical" ? (
                <Badge className="bg-red-600 text-white border-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  CHURN RISK
                </Badge>
              ) : null}
              {lead.expansion_opportunity && (
                <Badge className="bg-blue-600 text-white border-blue-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  EXPAND
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
          <div className="flex flex-col items-center gap-1">
            {hasScore && <ScoreGauge score={lead.marketing_score!} />}
            {hasHealth && (
              <div className="flex items-center gap-1 text-xs">
                <Heart className={`h-3 w-3 ${
                  lead.health_score! >= 60 ? "text-gc-green" :
                  lead.health_score! >= 40 ? "text-gc-amber" : "text-gc-red"
                }`} />
                <span className="text-gc-muted">{lead.health_score}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Score breakdown */}
        {hasBreakdown && (
          <div className="mt-4">
            <ScoreBreakdown breakdown={lead.score_breakdown!} />
          </div>
        )}

        {/* Gaps */}
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

        {/* Compact state for scored but no details */}
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

        {/* Awaiting scoring */}
        {!hasScore && (
          <div className="mt-4 py-3 text-center text-sm text-gray-400">
            Awaiting scoring...
          </div>
        )}

        {/* Follow-up timeline */}
        {hasFollowUps && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <FollowUpTimeline
              sentAt={lead.sent_at}
              followUps={lead.follow_ups}
              reply={lead.reply}
              status={lead.status}
            />
          </div>
        )}

        {/* Reply content */}
        {lead.reply && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              Reply ({lead.reply.sentiment})
            </p>
            <p className="text-sm text-emerald-900 line-clamp-3">
              {lead.reply.content}
            </p>
          </div>
        )}

        {/* Outreach draft */}
        {lead.outreach_draft && !hasFollowUps && (
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
