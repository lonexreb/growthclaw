import { z } from "zod/v4";

export const scoreBreakdownSchema = z.object({
  positioning_clarity: z.number(),
  cta_strength: z.number(),
  social_proof: z.number(),
  design_quality: z.number(),
  copy_quality: z.number(),
});

export const leadSchema = z.object({
  id: z.string(),
  source: z.string(),
  product_name: z.string(),
  founder_name: z.string(),
  website_url: z.string(),
  description: z.string(),
  social_handles: z.record(z.string(), z.string()).optional(),
  source_url: z.string(),
  found_at: z.string(),
  status: z.string(),
  marketing_score: z.number().optional(),
  score_breakdown: scoreBreakdownSchema.optional(),
  top_gaps: z.array(z.string()).optional(),
  enriched_at: z.string().optional(),
  outreach_draft: z.string().optional(),
  outreach_channel: z.string().optional(),
  outreach_hero_gap: z.string().optional(),
  outreach_pitch_point: z.string().optional(),
  outreach_status: z.string().optional(),
  drafted_at: z.string().optional(),
}).passthrough(); // allow extra fields from stages 4-6

export const leadsFileSchema = z.object({
  metadata: z.object({
    project: z.string(),
    version: z.string(),
    last_updated: z.string().nullable(),
    total_leads: z.number(),
  }),
  leads: z.array(leadSchema),
});

export const pipelineStatusSchema = z.object({
  stage: z.string(),
  started_at: z.string().nullable(),
  message: z.string(),
  detail: z.string().optional().default(""),
  progress: z.number().optional().default(0),
});
