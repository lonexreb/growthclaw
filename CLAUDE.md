# CLAUDE.md — GrowthClaw: Autonomous Founder-Scouting Outbound Engine

## What This Is

GrowthClaw is an OpenClaw-powered autonomous outbound agent that finds founders who just launched products, analyzes their marketing gaps, and drafts personalized outreach pitching Crowdstake's AI marketing OS. It runs 24/7 on a cron job and delivers qualified leads to Slack.

We are building this at the Austin OpenClaw Hackathon (April 4, 2026). Build window: 10:15 AM – 1:30 PM (~3.25 hrs). Demo: 2:00–3:00 PM. Judge: Alex Stulov, Crowdstake CTO.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SOUL.md                          │
│  (Brand voice, ICP definition, scoring rubric)      │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│  SKILL 1    │ │  SKILL 2    │ │  SKILL 3        │
│  Founder    │ │  Enrich &   │ │  Personalized   │
│  Scout      │ │  Qualify    │ │  Outreach       │
│             │ │             │ │  Drafts         │
│ browser +   │ │ browser +   │ │ AI + messaging  │
│ cron        │ │ AI scoring  │ │ + Slack/TG      │
└─────────────┘ └─────────────┘ └─────────────────┘
       │               │               │
       ▼               ▼               ▼
┌─────────────────────────────────────────────────────┐
│              leads.json / dashboard.md               │
│         Slack Channel: #growthclaw-leads             │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
growthclaw/
├── CLAUDE.md              # You are here
├── MEMORY.md              # Project context, Crowdstake intel, competitive landscape
├── TASKS.md               # Hour-by-hour task splits (Gopal, Shubh, Manu, Viren)
├── SOUL.md                # OpenClaw personality: Crowdstake brand voice + ICP
├── skills/
│   ├── founder-scout/
│   │   └── SKILL.md       # Scrapes PH, Indie Hackers, Reddit for new launches
│   ├── enrich-qualify/
│   │   └── SKILL.md       # Visits sites, scores marketing gaps, pulls social context
│   └── outreach-draft/
│       └── SKILL.md       # Generates personalized messages, posts to Slack
├── config/
│   ├── cron.yaml           # Heartbeat schedule (daily or on-demand for demo)
│   └── channels.yaml       # Slack/Telegram webhook config
├── data/
│   ├── leads.json          # Accumulated lead records
│   └── dashboard.md        # Auto-generated status report
└── demo/
    └── DEMO_SCRIPT.md      # 5-minute demo walkthrough for judges
```

## Tech Stack

- **OpenClaw** — the agent framework. Skills = Markdown files. No compilation.
- **Browser tool** — OpenClaw's built-in headless browser for scraping PH, Reddit, websites
- **LLM** — Claude or GPT-4 via API for scoring + outreach generation
- **Slack/Telegram** — native OpenClaw messaging channel for lead delivery
- **Cron heartbeat** — OpenClaw scheduled task for autonomous daily runs

## ICP (Ideal Customer Profile) for Crowdstake

- Technical founders / indie makers who just shipped a product
- Pre-revenue or early revenue ($0–$10K MRR)
- Have a live website/landing page that needs marketing help
- Active on Product Hunt, Indie Hackers, r/SideProject, r/startups, X
- Pain: built a great product, can't figure out positioning/marketing/conversion

## Key Crowdstake Selling Points (use in outreach)

1. AI marketing consultant that writes your positioning and messaging
2. Auto-generates landing pages with conversion-optimized copy (not templates)
3. Demand capture: emails, Stripe reservations, pre-orders, A/B testing
4. Free tier: $0/month, 2 projects, 5 daily build credits
5. "You build the product. We'll handle the marketing."

## Demo Strategy (5 minutes)

1. **30s** — Problem: "160K products launch on PH yearly. Most have terrible marketing. Crowdstake fixes that, but nobody knows Crowdstake exists."
2. **60s** — Solution: Show GrowthClaw architecture. Three skills. Runs autonomously.
3. **120s** — LIVE DEMO: Trigger the agent. Watch it browse Product Hunt, find a real founder who launched today, visit their site, score their landing page, draft a personalized message. Show the Slack notification arriving.
4. **30s** — Results: "In 24 hours of autonomous operation, GrowthClaw can surface 20-50 qualified founders per day at $0.30/lead in API costs."
5. **30s** — Close: "This isn't a hackathon project. This is Crowdstake's first growth hire. It works 24/7 for the price of API tokens. Fork the skills, swap the ICP, and any startup in this room can use it."

## Non-Negotiable Rules

- **Ship > Perfect.** If a skill works 80%, move on. Polish in hour 3.
- **Real data in demo.** No mock data. Live browse, live score, live draft.
- **Human-in-the-loop.** Outreach goes to Slack for review, NOT auto-sent. Judges love responsible automation.
- **Frame as reusable.** "Any startup can fork this" = bonus points.
- **Know Crowdstake's pain.** Mention: no PH launch, SEO crypto residue, 5 Facebook likes, CrowdStrike name collision. Shows homework.

## If Things Break

- Browser skill fails? → Fall back to API scraping (PH has a GraphQL API)
- Slack integration flaky? → Output to local dashboard.md + show in terminal
- LLM rate limited? → Pre-cache 3-5 scored leads before demo, run 1 live
- OpenClaw won't install? → Crowdstake staff on-site can help. Ask immediately, don't burn 30 mins debugging alone.

## Success Criteria

- [ ] Agent autonomously finds ≥3 real founders from Product Hunt
- [ ] Each founder's website is visited and scored with a marketing gap analysis
- [ ] Personalized outreach draft generated for each lead
- [ ] Results delivered to Slack (or shown in terminal/dashboard)
- [ ] Live demo runs end-to-end without manual intervention
- [ ] Presentation clearly articulates value to Crowdstake specifically
