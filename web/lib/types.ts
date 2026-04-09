// ── Lead Status (full sales cycle progression) ──

export type LeadStatus =
  // Stage 1-2: Discovery
  | "scouted"
  | "qualified"
  | "qualified-low"
  | "skipped"
  | "error"
  // Stage 3: Outreach
  | "outreach-drafted"
  // Stage 4: Follow-Up & Meeting
  | "outreach-sent"
  | "follow-up-1"
  | "follow-up-2"
  | "follow-up-3"
  | "reply-received"
  | "declined"
  | "no-response"
  | "meeting-booked"
  | "trial-started"
  | "stalled"
  // Stage 5: Convert & Close
  | "onboarding"
  | "active"
  | "converted"
  // Stage 6: Success & Expand
  | "expansion-ready"
  | "churning"
  | "churned";

export type OutreachStatus = "drafted" | "approved" | "skipped" | "sent";

// ── Scoring ──

export interface ScoreBreakdown {
  positioning_clarity: number;
  cta_strength: number;
  social_proof: number;
  design_quality: number;
  copy_quality: number;
}

// ── Stage 4: Follow-Up ──

export interface FollowUp {
  number: number;
  sent_at: string;
  content: string;
}

export interface Reply {
  received_at: string;
  sentiment: "interested" | "declined" | "question";
  content: string;
}

// ── Stage 5: Conversion ──

export interface UsageSignals {
  projects_created: number;
  credits_used_daily_avg: number;
  pages_published: number;
  total_time_minutes: number;
}

// ── Stage 6: Customer Success ──

export interface HealthBreakdown {
  login_trend: number;
  feature_adoption: number;
  credit_utilization: number;
  support_health: number;
}

// ── Lead (full record across all stages) ──

export interface Lead {
  id: string;
  source: string;
  product_name: string;
  founder_name: string;
  website_url: string;
  description: string;
  social_handles?: Record<string, string>;
  source_url: string;
  found_at: string;
  status: LeadStatus;

  // Stage 2: Enrich & Qualify
  marketing_score?: number;
  score_breakdown?: ScoreBreakdown;
  top_gaps?: string[];
  enriched_at?: string;

  // Stage 3: Outreach Draft
  outreach_draft?: string;
  outreach_channel?: string;
  outreach_hero_gap?: string;
  outreach_pitch_point?: string;
  outreach_status?: OutreachStatus;
  drafted_at?: string;

  // Stage 4: Follow-Up & Meeting
  contact_email?: string;
  contact_method?: string;
  sent_at?: string;
  follow_ups?: FollowUp[];
  reply?: Reply;
  meeting_url?: string;

  // Stage 5: Convert & Close
  signup_confirmed?: boolean;
  signup_at?: string;
  crowdstake_email?: string;
  signup_nudge_sent?: boolean;
  usage_signals?: UsageSignals;
  pql_score?: "low" | "medium" | "high";
  pql_triggered_at?: string;
  upgrade_prompt_sent?: boolean;
  upgrade_prompt_at?: string;
  converted?: boolean;
  converted_at?: string;
  plan?: string;
  mrr?: number;

  // Stage 6: Success & Expand
  onboarding_stage?: string;
  health_score?: number;
  health_breakdown?: HealthBreakdown;
  health_checked_at?: string;
  churn_risk?: "low" | "medium" | "high" | "critical";
  churn_risk_reason?: string;
  expansion_opportunity?: string;
  expansion_type?: string;
  expansion_suggested_at?: string;
  nps_score?: number;
  nps_collected_at?: string;
  lifetime_value?: number;
  months_active?: number;
}

// ── Leads File ──

export interface LeadsFile {
  metadata: {
    project: string;
    version: string;
    last_updated: string | null;
    total_leads: number;
  };
  leads: Lead[];
}

// ── Pipeline ──

export type PipelineStage =
  | "idle"
  | "scouting"
  | "scoring"
  | "drafting"
  | "following-up"
  | "converting"
  | "success-check"
  | "done"
  | "error";

export interface PipelineStatus {
  stage: PipelineStage;
  started_at: string | null;
  message: string;
  detail: string;
  progress: number;
}
