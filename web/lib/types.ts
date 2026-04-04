export type LeadStatus =
  | "scouted"
  | "qualified"
  | "qualified-low"
  | "outreach-drafted"
  | "skipped"
  | "error";

export type OutreachStatus = "drafted" | "approved" | "skipped";

export interface ScoreBreakdown {
  positioning_clarity: number;
  cta_strength: number;
  social_proof: number;
  design_quality: number;
  copy_quality: number;
}

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
  // Added by Stage 2 (enrich-qualify) — absent during Stage 1
  marketing_score?: number;
  score_breakdown?: ScoreBreakdown;
  top_gaps?: string[];
  enriched_at?: string;
  // Added by Stage 3 (outreach-draft) — absent during Stages 1-2
  outreach_draft?: string;
  outreach_channel?: string;
  outreach_status?: OutreachStatus;
  drafted_at?: string;
}

export interface LeadsFile {
  metadata: {
    project: string;
    version: string;
    last_updated: string | null;
    total_leads: number;
  };
  leads: Lead[];
}

export type PipelineStage =
  | "idle"
  | "scouting"
  | "scoring"
  | "drafting"
  | "done"
  | "error";

export interface PipelineStatus {
  stage: PipelineStage;
  started_at: string | null;
  message: string;
  detail: string;
  progress: number;
}
