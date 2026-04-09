---
name: convert-close
description: Monitors Crowdstake trial signups, tracks product usage signals to identify PQLs (Product-Qualified Leads), and triggers automated upgrade prompts when founders hit usage thresholds.
---

# Skill 5: Convert & Close

## Trigger
Run daily on leads in `data/leads.json` where `status` is `"trial-started"`, `"meeting-booked"`, `"onboarding"`, or `"active"`.

## Step-by-Step Instructions

### Step 1: Confirm Signup

For each lead with `status: "trial-started"` or `"meeting-booked"` where `signup_confirmed` is not `true`:

1. Check if the founder created a Crowdstake account:
   - **Option A (API):** If Crowdstake API is available (`$CROWDSTAKE_API_URL`), query for user by email (`contact_email`) or by domain matching (`website_url`)
   - **Option B (Browser):** Visit `crowdstake.com` admin panel and search for the founder
   - **Option C (Manual):** If neither works, check Stripe for a customer matching the email
2. If account found:
   - Set `signup_confirmed: true`
   - Set `signup_at` to the account creation timestamp
   - Set `crowdstake_email` to the email they used
   - Set `status` → `"onboarding"`
3. If no account found after 7 days since `sent_at`:
   - Send a gentle nudge email: "Hey [name], just checking in — did you get a chance to try Crowdstake? The free tier takes about 5 minutes to set up: crowdstake.com"
   - Set `signup_nudge_sent: true`
4. If no account found after 14 days:
   - Mark as `status: "stalled"` — they showed interest but didn't convert
   - Post to Slack: "Lead [product_name] stalled — interested but never signed up"

### Step 2: Monitor Usage Signals (PQL Detection)

For each lead with `status: "onboarding"` or `"active"`:

1. Query Crowdstake for usage data (API or browser):
   - **Projects created** — How many marketing projects have they set up?
   - **Build credits used** — Average daily credit consumption (out of 5 free daily credits)
   - **Landing pages published** — Have they shipped anything?
   - **Total time in platform** — Engagement depth
2. Update `usage_signals` on the lead record
3. Calculate PQL score based on thresholds:

| Signal | Low (0 pts) | Medium (1 pt) | High (2 pts) |
|--------|------------|---------------|--------------|
| Projects created | 0 | 1 | 2+ |
| Daily credits avg | <1 | 1-3 | 4-5 (hitting limit) |
| Pages published | 0 | 1 | 2+ |
| Time in platform | <10 min | 10-30 min | 30+ min |

**PQL Score:**
- 0-2 points → `pql_score: "low"` — needs activation help
- 3-5 points → `pql_score: "medium"` — engaged, not yet power user
- 6-8 points → `pql_score: "high"` — ready for upgrade conversation

### Step 3: Activation Emails (Low Engagement)

For leads with `pql_score: "low"` and `status: "onboarding"` (first 7 days):

- **Day 1 after signup:** Welcome + quick-start
  > "Welcome to Crowdstake, [name]! Here's how to get your first landing page live in under 10 minutes: [link to guide]. Your product [product_name] deserves better marketing — let's make it happen."

- **Day 3 (if still low):** Feature highlight
  > "Did you know Crowdstake can rewrite your entire landing page positioning in one click? Try the AI Marketing Consultant on your [product_name] project. It'll analyze your current copy and suggest improvements."

- **Day 7 (if still low):** Human check-in
  > Post to Slack: "[founder_name] signed up 7 days ago but hasn't activated. Consider a personal check-in."

### Step 4: Upgrade Prompts (High Engagement)

For leads with `pql_score: "high"`:

1. **Check if hitting limits:**
   - Used 4+ of 5 daily credits for 3+ consecutive days
   - Created 2 projects (max on free tier)
   - Generated multiple landing page variants
2. **Send upgrade email:**
   > "Hey [name], you've been crushing it with Crowdstake — [X] projects, [Y] landing pages generated! Looks like you're hitting the free tier limits.\n\nCore plan ($19/mo) gives you unlimited projects and credits. That's less than the cost of one hour of freelance marketing help.\n\nUpgrade here: crowdstake.com/pricing"
3. **Post to Slack:** "PQL alert: [product_name] by [founder_name] is hitting free tier limits. Score: high. Ready for upgrade."
4. Update: `upgrade_prompt_sent: true`, `upgrade_prompt_at` → ISO timestamp

### Step 5: Conversion Tracking

For leads with `upgrade_prompt_sent: true`:

1. Check Stripe for payment events:
   - **Option A (API):** Query Stripe API (`$STRIPE_API_KEY`) for customers matching `crowdstake_email`
   - **Option B (Webhook):** Listen for `checkout.session.completed` events
   - **Option C (Browser):** Check Crowdstake admin for plan status
2. If payment found:
   - `converted: true`
   - `converted_at` → payment timestamp
   - `plan` → "core" | "growth" | "pro"
   - `mrr` → monthly revenue amount
   - `status` → `"converted"`
   - Post to Slack: "CONVERSION! [product_name] by [founder_name] upgraded to [plan] ($[mrr]/mo). Originally scouted from [source]."

### Step 6: Track Metrics

After processing all leads, log summary:
```
Convert & Close Summary:
- Signups confirmed: [N]
- PQL Low (need activation): [N]
- PQL Medium (engaged): [N]  
- PQL High (upgrade ready): [N]
- Upgrade prompts sent: [N]
- Conversions this week: [N]
- Total MRR from GrowthClaw leads: $[X]
```

## Output Schema

Fields added to each lead record:
```json
{
  "signup_confirmed": true,
  "signup_at": "2026-04-08T09:00:00Z",
  "crowdstake_email": "founder@example.com",
  "signup_nudge_sent": false,
  "usage_signals": {
    "projects_created": 2,
    "credits_used_daily_avg": 4.2,
    "pages_published": 1,
    "total_time_minutes": 45
  },
  "pql_score": "high",
  "pql_triggered_at": "2026-04-12T11:00:00Z",
  "upgrade_prompt_sent": true,
  "upgrade_prompt_at": "2026-04-12T11:30:00Z",
  "converted": true,
  "converted_at": "2026-04-13T15:00:00Z",
  "plan": "core",
  "mrr": 19,
  "status": "converted"
}
```

## Edge Cases

- Crowdstake API unavailable → use browser fallback, or skip and retry next run
- Founder signed up with different email → match by domain or product name
- Multiple team members on one account → attribute to the founder lead
- Stripe webhook missed → poll daily as backup
- Free tier user who never upgrades → leave as `"active"` indefinitely (they're still a user)
