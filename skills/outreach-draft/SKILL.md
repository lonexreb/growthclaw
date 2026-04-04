---
name: outreach-draft
description: Generates personalized Crowdstake outreach messages for qualified leads and posts them to Slack for human review. Never auto-sends.
---

# Skill: Outreach Draft

## Description
Generates personalized outreach messages for qualified leads and delivers them to Slack for human review. Never auto-sends.

## Input
Leads from `data/leads.json` with `status: "qualified"` or `status: "qualified-low"`

## Process
For each qualified lead:

1. **Read the lead's enrichment data** — score, gaps, social context
2. **Generate personalized outreach** following SOUL.md voice guidelines:
   - Open with genuine compliment about their product
   - Reference a specific marketing gap found during scoring
   - Pitch the relevant Crowdstake capability that solves that gap
   - Include CTA to Crowdstake free tier
   - Keep it to 3-4 sentences max
3. **Post to Slack** with lead summary + draft message
4. **Update lead record** with outreach status

## Output Schema (outreach fields added to lead)
```json
{
  "outreach_draft": "Hey [Name], just saw [Product] on PH — ...",
  "outreach_channel": "slack",
  "outreach_status": "drafted",
  "drafted_at": "2026-04-04T12:00:00Z",
  "status": "outreach-drafted"
}
```

## Slack Message Format
```
--- NEW LEAD ---
Product: [product_name]
Founder: [founder_name]
Website: [website_url]
Source: [source]
Marketing Score: [score]/10
Top Gaps: [top_gaps as bullet list]

--- DRAFT OUTREACH ---
[outreach_draft]

--- ACTION ---
Reply with  to send | Reply with  to skip
```

## Edge Cases
- If Slack is unavailable, write to `data/dashboard.md` as fallback
- If lead has no gaps identified, generate a softer pitch focused on scaling
- Rate limit: max 10 outreach drafts per run
