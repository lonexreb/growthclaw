---
name: success-expand
description: Automated customer success for converted Crowdstake users. Runs onboarding sequences, computes health scores, prevents churn, triggers expansion opportunities, collects NPS, and feeds conversion data back to improve lead scoring.
---

# Skill 6: Success & Expand

## Trigger
Run weekly (Monday 9 AM) on leads in `data/leads.json` where `status` is `"converted"`, `"onboarding"`, `"active"`, `"expansion-ready"`, or `"churning"`.

## Step-by-Step Instructions

### Step 1: Onboarding Sequence (First 14 Days)

For leads with `status: "converted"` or `"onboarding"`:

Calculate days since `converted_at`. Send the appropriate onboarding email based on day:

**Day 0 (immediately after conversion):**
- Subject: "Welcome to Crowdstake, [name]! Here's your quick-start guide"
- Body:
  > "Congrats on upgrading, [name]! You're now on [plan]. Here's how to get the most out of Crowdstake in your first week:\n\n1. Start your first project: Tell the AI about [product_name] and watch it generate positioning\n2. Generate a landing page: One click, conversion-optimized copy\n3. Set up demand capture: Start collecting emails from day one\n\nQuestions? Just reply to this email."
- Set `onboarding_stage: "day-0"`, `status: "onboarding"`

**Day 3:**
- Subject: "Have you tried the AI Marketing Consultant yet?"
- Body: Highlight the specific feature that addresses their `outreach_hero_gap`
  > "Hey [name], based on what we saw on your current landing page, the AI Marketing Consultant would be perfect for fixing your [hero_gap]. Give it a try — it takes about 2 minutes."
- Set `onboarding_stage: "day-3"`

**Day 7:**
- Subject: "How's it going with Crowdstake?"
- Body: Check-in + offer help
  > "Hey [name], you're one week in! Just wanted to check — have you had a chance to generate a landing page for [product_name]? If you're stuck on anything, reply here and I'll help."
- Set `onboarding_stage: "day-7"`

**Day 14:**
- Subject: "Your first two weeks with Crowdstake"
- Body: Value milestone + usage stats
  > "Hey [name], here's what you've accomplished in 2 weeks:\n- [X] projects created\n- [Y] landing pages generated\n- [Z] build credits used\n\nYou're in the top [percentile] of Crowdstake users. Keep going!"
- Set `onboarding_stage: "complete"`, `status: "active"`

### Step 2: Health Scoring (Weekly for Active Customers)

For leads with `status: "active"` or `"expansion-ready"`:

1. Query Crowdstake for current usage data (same as Skill 5):
   - Login frequency (last 7 days)
   - Feature adoption (% of features used at least once)
   - Credit utilization (% of plan credits consumed)
   - Support tickets (open issues)

2. Calculate health score (0-100):
   ```
   health_score = (login_trend * 0.30) + (feature_adoption * 0.30) + (credit_utilization * 0.20) + (support_health * 0.20)
   ```

   Where each component is scored 0-100:
   - **login_trend:** 100 = logged in 5+ days this week, 0 = no logins in 14 days
   - **feature_adoption:** 100 = used all features, 0 = used only 1 feature
   - **credit_utilization:** 100 = using 80%+ of credits, 0 = using <10%
   - **support_health:** 100 = no open tickets, 50 = 1 ticket, 0 = 3+ open tickets

3. Update lead with `health_score`, `health_breakdown`, `health_checked_at`

### Step 3: Churn Prevention

Based on health score:

**Health 60-100 (Healthy):**
- `churn_risk: "low"`
- No action needed

**Health 40-59 (At Risk):**
- `churn_risk: "medium"`
- Send re-engagement email:
  > "Hey [name], noticed you haven't been using Crowdstake as much lately. Need help with anything? Here are 3 things you might not have tried yet: [feature suggestions based on unused features]"
- Post to Slack: "At-risk customer: [product_name] — health [score]/100"

**Health 20-39 (High Risk):**
- `churn_risk: "high"`, `status: "churning"`
- Send personal email from team (not automated-sounding):
  > "Hey [name], I'm [team member] from Crowdstake. I noticed your activity dropped off and wanted to personally check in. Is there something we could do better? I'd love to hop on a quick 10-minute call if you're open to it."
- Post to Slack with urgency: "CHURN RISK: [product_name] by [founder_name] — health [score]/100. Human intervention needed."

**Health 0-19 (Critical):**
- `churn_risk: "critical"`, `status: "churning"`
- Escalate to human immediately via Slack DM
- If no login in 30 days and plan renews soon → flag for cancellation prevention offer

### Step 4: Expansion Triggers

For leads with `status: "active"` and `health_score >= 60`:

Check for expansion signals:
1. **Hitting plan limits** → suggest next tier
   - Core user hitting credit limits → suggest Growth ($49/mo)
   - Growth user wanting team features → suggest Pro ($149/mo)
2. **Multi-user activity** → suggest team plan
   - Multiple email addresses on the account → team pricing
3. **Advanced feature usage** → suggest higher tier
   - Using A/B testing, Stripe integration → they need Growth/Pro

When expansion opportunity detected:
- Set `expansion_opportunity` to the type: `"plan-upgrade"`, `"team-add"`, or `"feature-upsell"`
- Set `status: "expansion-ready"`
- Send contextual email:
  > "Hey [name], you've been getting great results with Crowdstake — [specific metric]. The [next_plan] plan would unlock [specific benefit they'd use]. Worth a look: crowdstake.com/pricing"
- Post to Slack: "Expansion opportunity: [product_name] — [expansion_type]"

### Step 5: NPS & Advocacy

Trigger NPS surveys at milestones:
- **Day 30** after conversion
- **Day 90** after conversion
- **Day 180** after conversion

Send NPS email:
> "Hey [name], quick question: On a scale of 0-10, how likely are you to recommend Crowdstake to a fellow founder? Reply with just a number. (We read every response.)"

Based on response:
- **NPS 9-10 (Promoter):**
  - `nps_score: 9` or `10`
  - Trigger referral request: "Thanks! Would you be open to sharing your experience? We'd love to feature [product_name] as a case study."
  - Trigger review request: "If you have 2 minutes, a G2/Product Hunt review would mean the world to us."
- **NPS 7-8 (Passive):**
  - `nps_score: 7` or `8`
  - Ask for specific feedback: "Thanks! What's one thing we could do to make Crowdstake a 10/10 for you?"
- **NPS 0-6 (Detractor):**
  - `nps_score: 0` through `6`
  - Immediate human follow-up: "Thank you for the honest feedback. I'd love to understand what's not working — can I jump on a quick call?"
  - Post to Slack: "DETRACTOR ALERT: [product_name] NPS [score]. Needs immediate follow-up."

### Step 6: Feedback Loop (Improve Upstream Targeting)

Weekly analysis of converted vs churned customers:

1. **Source effectiveness:** Which sources (PH, Reddit, IH) produce customers that convert AND stay?
   - Calculate: conversion rate by source, churn rate by source, average LTV by source
2. **Score correlation:** Do marketing_score predictions hold up?
   - Do low-score leads (1-3) actually convert more than high-score leads?
   - Adjust scoring weights if data contradicts assumptions
3. **Gap correlation:** Which marketing gaps correlate with Crowdstake adoption?
   - If "no CTA" leads convert 3x more than "weak copy" leads → weight CTA gap higher in Skill 2
4. **Output recommendations:**
   - Post weekly Slack summary: "This week: [N] active customers, [X]% retention, $[Y] MRR. Best source: [source]. Recommended ICP adjustment: [suggestion]"
   - Log to `data/feedback-loop.json` for historical tracking

## Output Schema

Fields added to each lead record:
```json
{
  "onboarding_stage": "complete",
  "health_score": 75,
  "health_breakdown": {
    "login_trend": 80,
    "feature_adoption": 60,
    "credit_utilization": 90,
    "support_health": 70
  },
  "health_checked_at": "2026-04-14T09:00:00Z",
  "churn_risk": "low",
  "churn_risk_reason": null,
  "expansion_opportunity": "plan-upgrade",
  "expansion_type": "core-to-growth",
  "expansion_suggested_at": "2026-04-14T09:15:00Z",
  "nps_score": 9,
  "nps_collected_at": "2026-04-30T10:00:00Z",
  "lifetime_value": 228,
  "months_active": 12,
  "status": "active"
}
```

## Edge Cases

- Customer downgrades → don't mark as churning; update plan and MRR
- Customer cancels → set `status: "churned"`, `churned_at`, `churn_reason`
- Multiple accounts from same lead → track primary account only
- NPS reply is not a number → classify as feedback, route to human
- Crowdstake API down → skip health check, retry next week
