# Skill: Enrich & Qualify

## Description
Takes scouted leads, visits their websites, scores their marketing quality, and enriches the lead record with gap analysis and social context.

## Input
Leads from `data/leads.json` with `status: "scouted"`

## Process
For each scouted lead:

1. **Visit the website** — Load the founder's landing page via browser
2. **Score marketing quality** (1-10) based on SOUL.md rubric:
   - Positioning Clarity (25%)
   - CTA Strength (20%)
   - Social Proof (20%)
   - Design Quality (15%)
   - Copy Quality (20%)
3. **Identify top 3 specific marketing gaps** — actionable, concrete observations
4. **Pull social context** — Check Twitter/X bio if handle is available
5. **Update lead record** with enrichment data

## Output Schema (enriched fields added to lead)
```json
{
  "marketing_score": 4,
  "score_breakdown": {
    "positioning_clarity": 5,
    "cta_strength": 3,
    "social_proof": 2,
    "design_quality": 6,
    "copy_quality": 4
  },
  "top_gaps": [
    "No clear CTA above the fold — visitors don't know what to do next",
    "Zero social proof — no testimonials, user counts, or logos",
    "Positioning is feature-focused, not benefit-focused"
  ],
  "twitter_bio": "",
  "enriched_at": "2026-04-04T11:00:00Z",
  "status": "qualified"
}
```

## Qualification Gate
- Score **6 or below** → `status: "qualified"` (good lead for Crowdstake)
- Score **7-8** → `status: "qualified-low"` (reach out but lower priority)
- Score **9-10** → `status: "skipped"` (marketing already strong)

## Edge Cases
- If website is down or unreachable, set `status: "error"` and move on
- If website is a parked domain or placeholder, set score to 1 and note it
- Timeout after 15 seconds per site
