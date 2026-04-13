# TASKS.md — GrowthClaw Build Plan

**Build window:** 10:15 AM – 1:30 PM (3h 15m)
**Demo:** 2:00 – 3:00 PM
**Rule:** If something takes >20 min and isn't working, cut scope and move on.

---

## HOUR 0: Setup Sprint (10:15 – 10:45) — 30 min

Everyone gets OpenClaw running. No one touches skills until setup is confirmed.

| Person | Task | Done? |
|--------|------|-------|
| **Shubh** | Install OpenClaw, verify browser tool works. Create repo structure (`skills/`, `config/`, `data/`, `demo/`). Write initial `SOUL.md` with Crowdstake brand voice, ICP definition, and scoring rubric. | [x] |
| **Gopal** | Install OpenClaw, verify browser tool works. Test browsing Product Hunt (`producthunt.com/posts?order=newest`). Confirm you can extract post titles, maker names, URLs from the page. | [ ] |
| **Manu** | Install OpenClaw, verify LLM integration (Claude or GPT-4 API key loaded). Test a simple prompt: "Score this landing page for marketing quality" with a sample URL. Confirm AI reasoning works. | [ ] |
| **Viren** | Install OpenClaw, verify messaging channel works. Set up Slack workspace OR Telegram bot. Confirm OpenClaw can send a test message to the channel. If Slack fails, fall back to Telegram. | [ ] |

**Checkpoint 10:45:** Everyone says "my OpenClaw works." If anyone is stuck, Crowdstake staff on-site can help — ask NOW, not later.

---

## HOUR 1: Core Skills Build (10:45 – 11:45) — 60 min

Parallel build. Each person owns one deliverable.

| Person | Task | Deliverable | Done? |
|--------|------|------------|-------|
| **Shubh** | Write `SOUL.md` (agent personality, goals, constraints). Define the lead data schema in `leads.json`. Write the `DEMO_SCRIPT.md` outline. Start on integration logic — how Skill 1 → Skill 2 → Skill 3 chain together. | `SOUL.md`, `data/leads.json` schema, `demo/DEMO_SCRIPT.md` draft | [x] |
| **Gopal** | Build `skills/founder-scout/SKILL.md`. The skill browses Product Hunt newest, Indie Hackers new products, and r/SideProject. Extracts: product name, founder name, website URL, description, social handles. Outputs to `data/leads.json`. Test with ≥3 real leads. | `skills/founder-scout/SKILL.md` — working, tested | [ ] |
| **Manu** | Build `skills/enrich-qualify/SKILL.md`. Given a lead record (name, URL), the skill: (1) visits the founder's website, (2) analyzes landing page quality (positioning clarity, CTA presence, social proof, design), (3) generates a 1-10 "marketing gap score" with reasoning, (4) pulls Twitter/X bio if available. Outputs enriched record back to `leads.json`. | `skills/enrich-qualify/SKILL.md` — working, tested on 1 real site | [ ] |
| **Viren** | Build `skills/outreach-draft/SKILL.md`. Given an enriched lead (name, product, score, gaps), generates a personalized outreach message pitching Crowdstake. Tone: helpful, specific, not spammy. References the actual gap found. Includes CTA to Crowdstake free tier. Posts to Slack/Telegram channel. Also start building `data/dashboard.md` template. | `skills/outreach-draft/SKILL.md` — working, tested with mock data | [ ] |

**Checkpoint 11:45:** Each skill works independently. Test: Gopal finds a lead → Manu can score it → Viren can draft outreach for it. Even if manually chained, each piece works.

---

## HOUR 2: Integration & Pipeline (11:45 – 12:45) — 60 min

Connect the three skills into one autonomous pipeline.

| Person | Task | Done? |
|--------|------|-------|
| **Shubh** | Wire skills together in `SOUL.md` / orchestration config. Agent should: trigger Skill 1 → for each lead, trigger Skill 2 → for qualified leads (score ≥ 6), trigger Skill 3. Test the full chain end-to-end with 1 real lead. Debug any handoff issues. | [x] |
| **Gopal** | Add Reddit r/SideProject and r/startups as additional sources to Founder Scout. Handle edge cases: missing founder names, broken URLs, duplicate leads. Add dedup logic. Optimize browser scraping speed. | [ ] |
| **Manu** | Tune the scoring prompt. Run Skill 2 on 5 real websites found by Gopal's skill. Calibrate: a great landing page should score 8+, a bad one should score 3-4. Adjust the prompt until scores feel right. Add "top 3 specific improvements" to the output. | [ ] |
| **Viren** | Configure `config/cron.yaml` for scheduled runs (even if we demo manually). Build the auto-updating `data/dashboard.md`: table of leads found, scores, outreach status. Make it pretty — this shows in the demo. Ensure Slack messages include the score + gap summary, not just the outreach draft. | [ ] |

**Checkpoint 12:45:** Full pipeline runs. Trigger one command → agent finds founders → scores them → drafts outreach → posts to Slack. If it works once, it works for demo.

---

## HOUR 3: Polish & Demo Prep (12:45 – 1:30) — 45 min

No new features. Only polish, testing, and demo prep.

| Person | Task | Done? |
|--------|------|-------|
| **Shubh** | Run the full pipeline 3 times. Identify the single best lead (most impressive scoring + outreach). This is the "hero lead" for the live demo. Write the final `DEMO_SCRIPT.md` — every word of the 5-min pitch. Practice it once out loud. | [x] (hero lead: Vincero 5/10. Web dashboard built + reviewed.) |
| **Gopal** | Pre-cache 5 scored leads as backup. If live demo fails, we show these. Make sure `leads.json` has clean, impressive data. Help Shubh debug any pipeline issues. | [ ] |
| **Manu** | Review all outreach drafts for quality. Rewrite any that sound generic or spammy. Prepare 2-3 "killer lines" that reference real Crowdstake pain points (no PH launch, SEO crypto residue, 5 FB likes). These go in the pitch narrative. | [ ] |
| **Viren** | Final Slack channel cleanup — pin the best messages. Dashboard should look clean and impressive on screen. Set up screen sharing / demo display. Test: can we trigger the agent live and show it browsing in real-time? If browser is too slow for live, pre-record a 30s clip as backup. | [ ] |

**Checkpoint 1:30:** PENCILS DOWN. Eat tacos. Talk to people. Relax before demo.

---

## DEMO TIME (2:00 – 3:00 PM)

**Presenter:** Shubh (primary), Viren (screen/tech support)

### Demo Flow (5 minutes max)

| Time | Who | What |
|------|-----|------|
| 0:00–0:30 | Shubh | **Problem:** "160K products launch on PH yearly. Most founders have great products and terrible marketing. Crowdstake solves that — but with 5 Facebook likes and no Product Hunt launch, nobody knows they exist. We built their first growth hire." |
| 0:30–1:30 | Shubh | **Architecture:** Show the 3-skill pipeline diagram. "Founder Scout finds leads. Enrich & Qualify scores their marketing. Outreach Draft writes personalized messages. All autonomous, all OpenClaw." |
| 1:30–3:30 | Viren (screen) + Shubh (narrates) | **LIVE DEMO:** Trigger the agent. Watch it browse Product Hunt. Find a real founder. Visit their site. Score it. Generate outreach. Slack notification pops up. "That took 45 seconds and cost $0.02 in API tokens." |
| 3:30–4:15 | Shubh | **Results:** "We found [N] qualified founders today. Here's the dashboard. Average marketing gap score: [X]/10. Each one is a perfect Crowdstake customer." Show the dashboard.md. |
| 4:15–5:00 | Shubh | **Close:** "This is Crowdstake's first automated growth hire. $5/month VPS, $10/month LLM budget, 20-50 qualified leads per week. Every founder in this room can fork these skills and swap in their own ICP. We're open-sourcing everything." |

---

## FALLBACK PLAN (if things go wrong)

| Failure | Fallback |
|---------|----------|
| OpenClaw won't install | Ask Crowdstake staff immediately (they're on-site to help) |
| Browser tool too slow for live demo | Pre-run the pipeline, show cached results + Slack messages, do 1 live trigger as proof |
| Slack/Telegram integration fails | Output to terminal + dashboard.md. Still impressive. |
| LLM API rate limited | Pre-cache 5 leads before demo. Run 1 live. |
| One skill doesn't work | Demo the 2 that do. A working Founder Scout + Outreach alone is still strong. |
| Whole pipeline broken | Show individual skills working separately + the architecture. Explain the vision. Better than nothing. |

---

## SCOREBOARD — Track Progress

```
[x] OpenClaw installed (all 4)
[x] Browser tool verified
[x] LLM integration verified
[ ] Slack/Telegram channel live
[x] SOUL.md written
[x] Skill 1 (Founder Scout) works
[x] Skill 2 (Enrich & Qualify) works
[x] Skill 3 (Outreach Draft) works
[x] Skill 4 (Follow-Up & Meeting) — skill + backend + UI (Apr 12)
[x] Skill 5 (Convert & Close) — skill + backend + UI (Apr 12)
[x] Skill 6 (Success & Expand) — skill + backend + UI (Apr 12)
[x] Skills 1-3 chained together
[x] Full pipeline runs end-to-end
[x] ≥5 real leads scored and drafted (26 leads!)
[x] Web dashboard — full sales cycle (Next.js 16 + shadcn/ui)
[x] Progress bar + detail messages added
[x] Pipeline tested 5x — reliable 2-3 min runs
[x] Backup leads cached (26 leads in leads.json)
[x] Full sales cycle types + cron config
[x] Pipeline UI: 6-step stepper + funnel chart
[x] 3 new API routes (follow-up, convert, success)
[x] 5 new backend libs (email, imap, crowdstake, stripe, health)
[x] 2 new components (FunnelChart, FollowUpTimeline)
[x] StatsCards expanded to 8 metrics
[x] Header: 4 action buttons for full cycle
[ ] Skills 4-6 integration tested end-to-end
[ ] Env vars configured for SMTP/IMAP/Stripe
[ ] Demo script finalized
[ ] TACOS EATEN
```

---

## REMEMBER

- We are not building a prototype. We are building Crowdstake's growth engine.
- The judge is the CTO of the company we're building for. He will use this Monday.
- "Works live" beats "looks pretty" every time.
- If it's not in the demo, it doesn't exist. Cut ruthlessly.
- We already won. We just have to show up and execute.
