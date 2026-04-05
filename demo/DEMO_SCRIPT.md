# Demo Script — GrowthClaw (5 minutes)

**Presenter:** Shubh (primary), Viren (screen/tech support)

---

## 0:00–0:30 — The Problem

> "160,000 products launch on Product Hunt every year. Most of those founders built something incredible — and then froze when it came to marketing.
>
> Crowdstake solves exactly this. It's an AI marketing OS that writes your positioning, generates your landing page, and captures demand. But here's the irony: Crowdstake has 5 Facebook likes, no Product Hunt launch, and when you Google them, you get CrowdStrike the cybersecurity company.
>
> So we built their first growth hire."

## 0:30–1:30 — The Solution (Architecture)

> "GrowthClaw is an autonomous outbound engine built on OpenClaw. Three skills, zero human intervention required."

_[Show architecture diagram]_

> "**Skill 1: Founder Scout** — browses Product Hunt, Indie Hackers, and Reddit. Finds founders who launched today.
>
> **Skill 2: Enrich & Qualify** — visits each founder's website. Scores their marketing on a 10-point rubric. Identifies specific gaps.
>
> **Skill 3: Outreach Draft** — writes a personalized message pitching Crowdstake as the solution to their specific marketing gap. Posts to Slack for human review. Never auto-sends."

## 1:30–3:30 — LIVE DEMO

> "Let me show you what this looks like in action."

_[Trigger the pipeline]_

> "Watch — it's browsing Product Hunt right now, looking at today's launches..."
> "Found [product name]. Let's see... visiting their site..."
> "Marketing score: [X]/10. Top gaps: [list them]."
> "And here comes the outreach draft..."

_[Show Slack notification]_

> "That took [X] seconds and cost about $0.02 in API tokens."

## 3:30–4:15 — Results

> "In our testing today, GrowthClaw found [N] qualified founders. Here's the dashboard."

_[Show dashboard.md]_

> "Average marketing gap score: [X]/10. Every single one of these founders needs exactly what Crowdstake sells."

## 4:15–5:00 — The Close

> "This isn't a hackathon project. This is Crowdstake's first automated growth hire.
>
> $5/month VPS. $10/month in LLM costs. 20 to 50 qualified leads per week.
>
> And here's the best part — every founder in this room can fork these skills, swap in your own ICP, and have the same thing running by tonight.
>
> We're open-sourcing everything. The Clay.com experience at $0/month."

---

## Pre-Demo Checklist

```
[ ] cd web && pnpm dev — dashboard running on localhost:3000
[ ] Clear session locks: rm -f ~/.openclaw/agents/growthclaw/sessions/*.lock
[ ] Clear pipeline state: rm -f data/.pipeline-state.json data/.pipeline-pid
[ ] Verify dashboard shows 26 leads at localhost:3000
[ ] Browser tab open to vincero.app (hero lead)
[ ] Terminal ready with: scripts/run_pipeline.sh --demo (backup)
```

## Backup Plan

- If live demo fails: dashboard already has 26 scored leads — show those + click through Vincerò
- If openclaw hangs: narrate "we've run this 5 times today, here are real results" and drill into lead cards
- If dashboard won't start: run `scripts/run_pipeline.sh --demo` in terminal (beautiful colored banners)
- Hero lead: **Vincerò** (vincero.app) — score 5/10, founder posted "struggling with marketing" on Reddit
