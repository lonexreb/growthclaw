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
  social_handles: Record<string, string>;
  source_url: string;
  found_at: string;
  marketing_score: number;
  score_breakdown: ScoreBreakdown;
  top_gaps: string[];
  enriched_at: string;
  outreach_draft: string;
  outreach_channel: string;
  outreach_status: OutreachStatus;
  drafted_at: string;
  status: LeadStatus;
}

export interface LeadsFile {
  metadata: {
    project: string;
    version: string;
    last_updated: string;
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
}
