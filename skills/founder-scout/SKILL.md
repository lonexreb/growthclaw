---
name: founder-scout
description: Scrapes Product Hunt, Indie Hackers, and Reddit for founders who just launched products. Saves structured lead data to data/leads.json.
---

# Skill: Founder Scout

## Description
Scrapes Product Hunt, Indie Hackers, and Reddit for founders who just launched products. Extracts structured lead data and saves to `data/leads.json`.

## Sources
- Product Hunt: `producthunt.com/posts?order=newest`
- Indie Hackers: `indiehackers.com/products`
- Reddit: `r/SideProject`, `r/startups`

## Output Schema
Each lead record:
```json
{
  "id": "ph-001",
  "source": "producthunt",
  "product_name": "",
  "founder_name": "",
  "website_url": "",
  "description": "",
  "social_handles": {
    "twitter": "",
    "producthunt": "",
    "linkedin": ""
  },
  "source_url": "",
  "found_at": "2026-04-04T10:00:00Z",
  "status": "scouted"
}
```

## Instructions
1. Browse to each source URL
2. Extract the 10 most recent product launches
3. For each launch, extract: product name, founder/maker name, website URL, short description, social handles
4. Deduplicate by website URL
5. Save results to `data/leads.json`
6. Log summary: "[N] new leads found from [sources]"

## Edge Cases
- If founder name is missing, use the product name as fallback
- If website URL is missing, skip the lead
- If a lead already exists in leads.json (by URL), skip it
