---
name: enrich-qualify
description: Takes scouted leads, visits their websites, scores marketing quality on a 10-point rubric, and enriches records with gap analysis.
---

# Skill: Enrich & Qualify

## Description
Takes scouted leads from `data/leads.json`, visits their websites via browser, scores their marketing quality, and enriches each lead record with a gap analysis and social context.

## Trigger
Run this skill on leads in `data/leads.json` that have `"status": "scouted"`.

## Step-by-Step Instructions

For each lead with `"status": "scouted"` in `data/leads.json`:

### Step 1: Visit the website
- Use the browser tool to navigate to the lead's `website_url`
- Wait for the page to fully load (up to 15 seconds)
- If the site is unreachable, returns an error, or is a parked/placeholder domain:
  - Set `"status": "error"` and `"error_reason": "site unreachable"` (or `"parked domain"`)
  - Move to the next lead

### Step 2: Analyze the landing page
Read the visible page content carefully. You are scoring **how much this founder needs Crowdstake's help**, not how pretty the site looks. A site can have nice design but still desperately need marketing help.

Evaluate these five dimensions. 

| Dimension | Weight | Score 1-10 | What to evaluate |
|-----------|--------|------------|-----------------|
| **Positioning Clarity** | 25% | ? | Can a NON-TECHNICAL stranger tell what the product does and why they should care in 5 seconds? Developer jargon like "open-source backend" or "API toolkit" with no benefit statement = score 3-4 max. |
| **CTA Strength** | 20% | ? | Is there ONE clear, compelling call-to-action above the fold that drives signups/trials? "Explore features" or "Read docs" is NOT a real CTA = score 3-4. A strong CTA is "Start free trial" or "Get started in 60 seconds". |
| **Social Proof** | 20% | ? | Testimonials from real users with names/photos? User count ("10,000+ teams")? Customer logos? GitHub stars alone don't count as marketing social proof. No social proof at all = score 1-2. |
| **Design Quality** | 10% | ? | Does it look professional? This is weighted LOW because design is not what Crowdstake fixes. A clean template still scores 6-7 here. |
| **Copy Quality** | 25% | ? | Does the copy sell benefits or just list features? Does it speak to the visitor's pain, or just describe the product? Feature-dump copy ("supports X, Y, Z") = score 3-4. Benefit-led copy ("Ship 10x faster") = score 7+. |

Calculate the weighted overall score:
`marketing_score = (positioning * 0.25) + (cta * 0.20) + (social_proof * 0.20) + (design * 0.10) + (copy * 0.25)`

Round to nearest integer.

**Scoring mindset:** You are a marketing expert evaluating whether this founder would benefit from an AI marketing OS. Most indie hackers are great builders but mediocre marketers — their scores should reflect that. Don't give credit for "looking clean" if the messaging doesn't convert.

### Step 3: Identify top 3 marketing gaps
Write exactly 3 specific, actionable gaps. Each gap MUST:
- Name the exact element that's missing or broken (not "could be better")
- Quote or reference actual text/elements from the page when possible
- Be specific enough that someone could fix it in 30 minutes

Examples of GOOD gaps:
- "No CTA above the fold -- the first button ('Get Started') is below 2 screens of feature lists"
- "Zero social proof -- no testimonials, user counts, logos, or trust signals anywhere on the page"
- "Headline says 'AI-powered API for data processing' -- this is feature jargon, should be rewritten as a benefit like 'Process your data 10x faster'"
- "Landing page has 4 different CTAs ('Sign up', 'Book demo', 'Watch video', 'Read docs') -- visitors don't know which to click"

BAD gaps (these are too vague and useless for outreach):
- "Social proof could be stronger" -- HOW? What's missing specifically?
- "Design needs work" -- WHAT specifically about the design?
- "CTA could be more compelling" -- What's wrong with the current one?

### Step 3b: Suggest top 3 specific improvements
For each gap, write one concrete improvement Crowdstake could help with. These feed directly into the outreach message.

Format:
- "Gap: [the gap] -> Fix: [what Crowdstake would do]"

Example:
- "Gap: No CTA above the fold -> Fix: Crowdstake auto-generates landing pages with conversion-optimized CTAs placed above the fold"
- "Gap: Headline is feature-focused jargon -> Fix: Crowdstake's AI rewrites positioning to be benefit-focused and clear to non-technical visitors"

### Step 4: Check for Twitter/X presence
- Look for a Twitter/X link on the landing page
- If found, note the handle
- If not found on the page, check if the lead record already has a `social_handles.twitter` value
- Set `twitter_bio` to the handle found, or `""` if none

### Step 5: Update the lead record
Add these fields to the lead in `data/leads.json`:

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
    "No clear CTA above the fold -- the first action button is buried below 3 feature sections",
    "Zero social proof -- no testimonials, user counts, or logos anywhere on the page",
    "Headline says 'Smart API toolkit' -- feature jargon instead of a clear benefit statement"
  ],
  "improvements": [
    "Crowdstake auto-generates landing pages with conversion-optimized CTAs above the fold",
    "Crowdstake adds social proof sections with testimonial collection and display",
    "Crowdstake's AI rewrites positioning to be benefit-focused and clear to any visitor"
  ],
  "twitter_bio": "@founderhandle",
  "enriched_at": "2026-04-04T11:00:00Z",
  "status": "qualified"
}
```

### Step 6: Apply qualification gate
Based on the `marketing_score`, set the lead's status:
- **Score 1-6** -> `"status": "qualified"` (high priority -- Crowdstake can clearly help)
- **Score 7-8** -> `"status": "qualified-low"` (worth reaching out, lower priority)
- **Score 9-10** -> `"status": "skipped"` (marketing already strong, skip outreach)

## After processing all leads
- Update the `metadata.last_updated` timestamp in `data/leads.json`
- Log a summary: "Enriched [N] leads: [X] qualified, [Y] qualified-low, [Z] skipped, [W] errors"

## Scoring Calibration Guide
The score answers: "How much does this founder need Crowdstake?" Lower = needs more help = better lead.

- **Score 1-2**: No real landing page. Parked domain, blank page, or just a logo.
- **Score 3-4**: Site exists but marketing is weak. Feature-jargon headline, no real CTA ("Read docs"), zero social proof. Looks like a developer built it without marketing input. **This is where most indie launches land. This is the sweet spot for Crowdstake.**
- **Score 5-6**: Has some marketing elements but clear gaps. Maybe a decent headline but no social proof, or a CTA that's buried. Founder tried but needs professional help.
- **Score 7-8**: Solid marketing. Clear benefit-led positioning, real CTA, some social proof. Only minor improvements needed. Lower priority lead.
- **Score 9-10**: Marketing is already professional-grade. Multiple forms of social proof, A/B tested CTAs, benefit-driven copy throughout. Skip — they don't need Crowdstake.

**Reference points from calibration:**
- pocketbase.io = **4** (dev docs page, "Explore all features" CTA, zero social proof, feature-focused headline)
- screenpi.pe = **5** (has positioning but weak social proof and generic CTA)
- tally.so = **7** (strong positioning, real CTAs, some social proof)
- cal.com = **7** (established, clear value prop, but social proof not prominent)
- dub.co = **8** (strong marketing, real testimonials, benefit-led copy, minor CTA improvements possible)

## Important
- Process leads one at a time. Don't batch.
- Be honest in scoring. The whole pipeline depends on accurate scores.
- Write gaps that are specific enough for the outreach skill to reference them in personalized messages.
- Always save progress to `data/leads.json` after each lead (don't wait until the end).
