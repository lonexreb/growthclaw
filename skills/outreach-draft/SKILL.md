---
name: outreach-draft
description: Generates personalized Crowdstake outreach messages for qualified leads and posts them to Slack for human review. Never auto-sends.
---

# Skill: Outreach Draft

## Description
Generates a short, personalized outreach message for each qualified lead and delivers it to Slack (`#all-growthclaw`) for human review. **Never auto-sends.** Human-in-the-loop is a hard constraint — a human must approve every message before it leaves the workspace.

Owned by: Viren (delivery layer)
Reads from: `data/leads.json` (records produced by `enrich-qualify`)
Writes to: `data/leads.json` (outreach fields), `data/dashboard.md`, Slack `#all-growthclaw`

---

## Input Contract

This skill consumes leads in `data/leads.json` where `status` is one of:
- `"qualified"` — score ≤ 7 (clear Crowdstake fit)
- `"qualified-low"` — score 7–8 (softer pitch, lower priority)

Leads with `status: "skipped"` (score 9–10) are ignored — those founders don't need Crowdstake.

Expected input fields per lead (produced upstream by `enrich-qualify`):
```json
{
  "id": "ph_2026-04-04_0001",
  "product_name": "FooBar",
  "founder_name": "Jane Doe",
  "website_url": "https://foobar.io",
  "source": "producthunt",
  "source_url": "https://producthunt.com/posts/foobar",
  "description": "one-line from the launch post",
  "social": { "twitter": "@janedoe", "linkedin": null },
  "score": 4,
  "score_breakdown": {
    "positioning": 3,
    "cta": 2,
    "social_proof": 4,
    "design": 6,
    "copy": 5
  },
  "top_gaps": [
    "No clear CTA above the fold",
    "Headline is feature-focused, not benefit-focused",
    "Zero social proof on landing page"
  ],
  "status": "qualified"
}
```

If any of `founder_name`, `product_name`, `website_url`, `top_gaps` is missing, fall back to generic-but-still-polite phrasing (see **Fallback Phrasing** below) rather than skipping the lead.

---

## Process

For each lead with `status` ∈ {`qualified`, `qualified-low`}:

1. **Skip rules first** (do NOT draft outreach if):
   - `score ≥ 9` — their marketing is already strong
   - `outreach_status == "drafted"` or `"sent"` — already handled in a previous run (dedup)
   - Lead record missing both `founder_name` and `product_name` — not enough to personalize

2. **Select the hero gap.** Pick the first entry in `top_gaps` — that's the specific thing we'll reference. If `top_gaps` is empty, use a generic "scaling early traction" angle.

3. **Pick the matching Crowdstake pitch point** from this mapping (gap → pitch):

   | Gap keyword                     | Crowdstake pitch to reference                                            |
   |---------------------------------|--------------------------------------------------------------------------|
   | CTA, call to action, conversion | "auto-generates landing pages with conversion-optimized copy"            |
   | positioning, headline, unclear  | "AI marketing consultant that writes your positioning and messaging"     |
   | social proof, testimonial, trust| "demand capture: emails, Stripe reservations, pre-orders, A/B testing"   |
   | design, mobile, slow, ugly      | "auto-generates landing pages with conversion-optimized copy (not templates)" |
   | copy, benefits, jargon          | "AI marketing consultant that writes your positioning and messaging"     |
   | _no gap / generic_              | "You build the product. We'll handle the marketing."                     |

4. **Generate the message** via the LLM, following the template in **Voice Rules** below. Max 4 sentences. The LLM prompt (model-agnostic) is:

   ```
   You are GrowthClaw, following the voice defined in SOUL.md.
   Write a 3–4 sentence outreach message to {founder_name} about their product {product_name} ({website_url}).
   It was found on {source}. Description: {description}.

   Specific marketing gap to reference (do NOT list all gaps — pick the one below and reference it naturally):
   {hero_gap}

   Pitch Crowdstake as the solution using this angle:
   {pitch_point}

   Hard rules:
   - Open with genuine appreciation for what they built (1 sentence, specific to the product, no empty flattery).
   - Reference the gap as an observation, not a criticism. "I noticed..." is fine. "Your site is bad" is not.
   - Mention Crowdstake by name exactly once and include the URL crowdstake.ai.
   - Mention the free tier ($0/month).
   - Do NOT use the words: "revolutionary", "game-changer", "leverage", "synergy", "unlock", "10x".
   - Do NOT start with "I hope this email finds you well" or any cold-email boilerplate.
   - Sign off with just "— GrowthClaw (for Crowdstake)" — no "Best regards" fluff.
   ```

5. **Post to Slack** (`#all-growthclaw`) via the Incoming Webhook in `$SLACK_WEBHOOK_URL` (loaded from `.env.local`). Shape the payload as a Block Kit `blocks` array (see **Slack Message Format**). A single `curl -X POST -H 'Content-Type: application/json' --data @payload.json "$SLACK_WEBHOOK_URL"` is sufficient — the webhook is post-only and scoped to `#all-growthclaw`, so no channel routing is required.

6. **Write back to `leads.json`** — add the outreach fields (see Output Schema).

7. **Update `data/dashboard.md`** — increment `outreach_drafted` count, append the lead to the recent leads table, refresh score distribution and top gaps.

8. **Rate limit:** max **10 outreach drafts per run** to avoid batch spam and keep Slack review tractable. If more leads are qualified, leave them for the next run (their status stays `qualified`).

---

## Output Schema (fields added to each lead)

```json
{
  "outreach_draft": "Hey Jane — loved what you shipped with FooBar, ...",
  "outreach_channel": "slack",
  "outreach_hero_gap": "No clear CTA above the fold",
  "outreach_pitch_point": "auto-generates landing pages with conversion-optimized copy",
  "outreach_status": "drafted",
  "drafted_at": "2026-04-04T12:00:00Z",
  "slack_message_ts": "1712246400.001234",
  "status": "outreach-drafted"
}
```

`outreach_status` progresses: `drafted` → `approved` → `sent` → `replied` (approval + send is a human action; we only write `drafted` here).

---

## Slack Message Format

Use Slack Block Kit so the message is scannable and actionable. Posted to `#all-growthclaw`.

```
:rotating_light: *New Lead* — {product_name}
───────────────────────────────
*Founder:* {founder_name}   {twitter_link_if_any}
*Website:* {website_url}
*Source:* {source}  ({source_url})
*Marketing Score:* *{score}/10*  ({score_label})

*Top Gaps:*
• {gap_1}
• {gap_2}
• {gap_3}

*Draft Outreach:*
>>> {outreach_draft}

*Pitch Angle:* {pitch_point}
───────────────────────────────
React with :white_check_mark: to approve · :x: to skip · :pencil2: to edit
```

Where `{score_label}` is:
- 1–3 → `"high priority"`
- 4–6 → `"good fit"`
- 7–8 → `"soft pitch"`

The `:white_check_mark: / :x: / :pencil2:` reactions are read by a future approval skill — for now they exist as the human review interface. We do not auto-send based on reactions during the hackathon demo.

---

## Voice Rules (enforced in LLM prompt)

Must-do:
- ✅ Name-drop the product and one specific thing about it
- ✅ Reference one specific gap as an observation
- ✅ Name Crowdstake exactly once + `crowdstake.ai`
- ✅ Mention the free tier
- ✅ 3–4 sentences, ≤ 90 words total

Must-not:
- ❌ Buzzwords: revolutionary, game-changer, leverage, synergy, unlock, 10x, disrupt, cutting-edge
- ❌ Cold-email openers: "I hope this finds you well", "My name is..."
- ❌ Fake familiarity: "As a fellow founder..."
- ❌ More than one Crowdstake pitch point per message
- ❌ Signing off with "Best regards" / "Sincerely" — use "— GrowthClaw (for Crowdstake)"

### Fallback phrasing (when personalization data is thin)

If `top_gaps` is empty or generic: "Noticed {product_name} is still early — Crowdstake's free tier is built for exactly this stage: it handles the positioning, landing page copy, and demand capture so you can stay focused on the product."

---

## Edge Cases

| Situation | Behavior |
|---|---|
| Slack channel unreachable | Write the formatted message to `data/dashboard.md` under a `## Pending Outreach` section. Lead still marked `outreach_status: "drafted"`. Log a warning. |
| LLM API error / rate-limited | Retry once with 5s backoff. If still failing, write a **template-based** draft using the Outreach Template in SOUL.md (no LLM) and mark `outreach_status: "drafted-template"` so a human knows it needs extra review. |
| Duplicate lead (same `website_url` as a previous run) | Skip silently. Do not re-draft. |
| `top_gaps` empty | Use fallback phrasing above. Still draft, still post. |
| Lead has `score >= 9` | Skip. Their marketing is strong — reaching out would be spam. |
| More than 10 qualified leads in one run | Draft the 10 with the lowest scores (highest Crowdstake fit) first. Leave the rest at `status: "qualified"` for the next run. |
| LLM returns a message containing any banned buzzword | Reject the draft, retry once with the rule re-emphasized. On second failure, use template-based draft. |

---

## Success Criteria (for this skill)

- [ ] Given 3 mock qualified leads, produces 3 distinct personalized drafts
- [ ] Each draft references the hero gap from `top_gaps[0]`
- [ ] Each draft includes `crowdstake.ai` and "free tier"
- [ ] Each draft passes the banned-buzzword check
- [ ] Slack message renders cleanly with blocks in `#all-growthclaw`
- [ ] `leads.json` is updated with the `outreach_*` fields
- [ ] `dashboard.md` is updated with the new row
- [ ] Rate limit of 10/run is respected
