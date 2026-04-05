# MEMORY.md — GrowthClaw Project Context

## Event Context

- **Event:** Austin OpenClaw Hackathon
- **Date:** April 4, 2026
- **Location:** Mort Subite European Bar, 308 Congress Ave, Austin TX
- **Schedule:** 10:00 AM check-in → 10:15 build starts → 1:30 PM tacos → 2:00–3:00 PM demos
- **Build window:** ~3 hours 15 minutes
- **Registrants:** 160 (sold out)
- **Vibe:** "Slightly chaotic, very productive" build day. No formal tracks/rubrics.
- **Note:** Registration required wallet-based token verification (Web3 crossover)

## Our Team

| Name   | Role               | Strengths                                    |
|--------|-------------------|----------------------------------------------|
| Shubh  | Lead / Architecture | ML, agents, OpenClaw setup, demo presentation |
| Gopal  | Skill Builder      | Backend, API integration, browser automation  |
| Manu   | Skill Builder      | LLM prompting, outreach copy, scoring logic   |
| Viren  | Integration / Demo  | Slack/messaging, dashboard, demo polish        |

## Judge Profile

- **Name:** Alexander (Alex) Stulov
- **Title:** CTO, Crowdstake
- **What he cares about:** Working demos > slides. Direct value to his company. Creative use of OpenClaw capabilities. Reusable/forkable skills.
- **How to impress him:** Reference specific Crowdstake problems (no PH launch, SEO crypto residue, 5 FB likes). Show you understand the product deeply. Build something he can deploy Monday morning.

## Crowdstake Deep Intel

### What They Are Now
- **AI Marketing Operating System for Founders**
- Tagline: "You build the product. We'll handle the marketing."
- 3-step flow: (1) AI marketing consultant → (2) auto-generated landing pages → (3) demand capture (email, Stripe, pre-orders, A/B testing)
- Target: technical founders and indie makers with "blank-page paralysis" on marketing

### Pricing
| Tier   | Price    | Limits                                      |
|--------|----------|----------------------------------------------|
| Free   | $0/mo    | 2 projects, 5 daily build credits            |
| Core   | $19/mo   | More projects + credits                      |
| Growth | $49/mo   | Expanded features                            |
| Pro    | $149/mo  | Not launched yet. Team collab, email sequences, ads |

### The Pivot (Critical Context)
- **Before:** Crowdstake Global, Inc. — crypto-powered nonprofit donation platform
- **After:** Crowdstake AI, Inc. — AI marketing OS for founders
- Google still shows old crypto/nonprofit descriptions
- Old meta tags on /contribute and /login reference the defunct product
- This SEO residue is a real pain point. Mention it in the demo.

### Traction (Near-Zero)
- Facebook: 5 likes
- Twitter (@Crowdstake_AI): minimal engagement
- No Product Hunt launch
- No customer testimonials or case studies on site
- No blog or content marketing
- ~5 person team
- No Crunchbase funding rounds
- 1 podcast appearance (I AM CEO, Feb 2025)
- 1 press release (EIN Presswire)
- Name collides with CrowdStrike ($90B cybersecurity company) in search results

### Six Growth Bottlenecks We're Solving
1. **Zero awareness** among indie hackers / technical founders
2. **SEO residue** from the crypto pivot polluting search results
3. **No social proof** — zero testimonials, case studies, user logos
4. **No content engine** — no blog, no educational content, no inbound
5. **Manual outbound only** — just a Calendly link and sporadic posts
6. **Name discoverability** — CrowdStrike drowns them in search

### Competitors
| Product          | What They Do                      | Crowdstake Advantage            |
|-----------------|-----------------------------------|----------------------------------|
| Unicorn Platform | Website builder (104K+ sites)    | AI-first, not template-first    |
| Unbounce        | Landing page builder              | AI consultant + copy generation |
| Leadpages       | Landing pages + conversion        | AI positioning, not drag-drop   |
| Carrd           | Simple one-page sites             | Full marketing OS, not just page|
| Emergent.sh     | AI landing page generator         | Demand capture + A/B testing    |
| Landingsite.ai  | AI landing page generator         | Marketing consultant, not just gen |

## Web Dashboard (Built ~1:30 PM CST, updated ~2:30 PM)

- **Stack:** Next.js 16 + React 19 + shadcn/ui + Tailwind in `web/` subdirectory
- **Features:** Lead cards with SVG score gauges, score breakdowns, collapsible outreach drafts with approve/skip, pipeline stepper (Scout→Score→Draft→Done), progress bar with live detail messages, stats overview, activity log
- **API:** `/api/leads` reads/writes `data/leads.json`, `/api/pipeline` spawns openclaw agent as child process
- **Theme:** Brand palette with gc-red (#dc2626), gc-green, gc-muted
- **Demo:** Optimized for projector — large fonts, high contrast, 1600px max width
- **Run:** `cd web && pnpm dev` → http://localhost:3000

### Key Fixes Applied
1. Lead fields made optional for mid-pipeline polling (prevents React crashes)
2. Path resolution uses `process.cwd()` not `__dirname` (Next.js 16 `__dirname` resolves into `.next/` build output, broke leads API)
3. Pipeline state persisted to `data/.pipeline-state.json` (survives HMR reloads)
4. PID file (`data/.pipeline-pid`) tracks openclaw process — prevents false "interrupted" errors on HMR reload
5. Detached child process (`detached: true`) so openclaw survives HMR
6. Progress bar with stage-based percentage (scouting=10%, scoring=40%, drafting=70%, done=100%)
7. Detail extraction from openclaw stdout — parses URLs, subreddit names, product names from agent output
8. Error state preserves last progress value instead of resetting to 0

### Known Issues
- Openclaw session lock files can get stuck if process is killed (`~/.openclaw/agents/growthclaw/sessions/*.lock`) — clear manually before demo
- Stage detection stays on "scouting" sometimes because openclaw output doesn't always match keyword patterns — pipeline still completes correctly
- Product Hunt blocked by Cloudflare — all scouting falls back to Reddit (r/SideProject, r/startups, r/webdev, r/IMadeThis)

## Pipeline Status (Live as of 2:35 PM CST)

### Pipeline Runs (5 successful runs today)
- **Pipeline:** growthclaw-pipeline skill chains Scout → Enrich → Outreach in a single agent session
- **Source:** Reddit (r/SideProject, r/startups, r/webdev, r/IMadeThis, r/Entrepreneur) — Product Hunt blocked by Cloudflare
- **Browser:** Gateway not running, uses `web_fetch` fallback successfully
- **Total leads found:** 26 real leads, all scored and with outreach drafted
- **Run time:** ~2-3.5 minutes per run, finds 2-3 new leads each time
- **Score range:** 2 to 8 out of 10

### Lead Highlights (26 total)

| Product | Score | Key Gap |
|---------|-------|---------|
| **Instavault** | 2/10 | Lowest score — severe marketing gaps |
| **UnFin** | 2/10 | Severe gaps |
| **Ditherit** | 3/10 | Very weak marketing |
| **Vincerò** (hero lead) | 5/10 | Weak social proof, buried CTA |
| **PanelShot** | 8/10 | Missing testimonials |
| **JobScoutly** | 8/10 | Highest score |

### Hero Lead for Demo
**Vincerò** (vincero.app) — AI OS for solopreneurs. Founder explicitly mentioned struggling with marketing on Reddit. Score 5/10 with clear gaps that map directly to Crowdstake's value prop. Best outreach draft references specific pain points.

### Technical Notes
- OpenClaw v2026.2.2-3 installed, `growthclaw` agent registered
- All 4 skills have YAML frontmatter for OpenClaw discovery
- API key stored in `~/.openclaw/agents/growthclaw/agent/auth-profiles.json`
- Session lock files must be cleared before demo: `rm -f ~/.openclaw/agents/growthclaw/sessions/*.lock`
- For live demo: `cd web && pnpm dev` then click "Run Pipeline" button on dashboard

## OpenClaw Platform Knowledge

- **What:** Open-source AI agent framework, 247K+ GitHub stars
- **Creator:** Peter Steinberger (formerly ClawdBot/MoltBot)
- **Core capability:** LLMs that take real actions — browse web, run shell commands, call APIs, send messages across 25+ platforms, execute cron jobs
- **Skills:** Built as Markdown files (SKILL.md) with YAML frontmatter. No compilation, no SDK.
- **Key tools we'll use:**
  - `browser` — headless browsing, scraping, form filling
  - `shell` — run commands, process data
  - `messaging` — Slack, Telegram, Discord, email (25+ channels)
  - `cron` — scheduled task execution (heartbeat)
  - `file` — read/write local files (leads.json, dashboard.md)
- **SOUL.md** — defines the agent's personality, goals, and constraints

## Competitive Landscape (Growth/Marketing Tools)

| Tool          | What It Does                           | Price         | Gap                              |
|--------------|----------------------------------------|---------------|----------------------------------|
| Clay         | Data enrichment, 150+ providers        | $185+/mo      | Too expensive for indie makers   |
| Apollo.io    | 275M+ contacts, prospecting            | $49+/mo       | Built for sales teams, not makers|
| Instantly.ai | Cold email at scale                    | $30+/mo       | Email-only, no intelligence      |
| PhantomBuster| 130+ social automation scripts         | $69+/mo       | Scripts, not autonomous agents   |
| 11x.ai       | AI SDR agents                         | $5,000/mo     | Enterprise pricing, wrong ICP    |
| Unify        | Signal-driven outbound                 | Enterprise    | Enterprise pricing               |

**Our positioning:** "The growth engine for founders who can't afford a growth stack." OpenClaw is free. Skills are open-source. Total cost: $5/mo VPS + $10/mo LLM API = 20-50 qualified leads/week.

## Key Phrases for Demo / Pitch

- "Crowdstake's first automated growth hire"
- "Works 24/7 for the price of API tokens"
- "The Clay.com experience at $0/month"
- "Every founder in this room can fork these skills"
- "We found [X] founders who launched on Product Hunt TODAY and need exactly what Crowdstake sells"
- "Your ICP is literally posting 'help me with marketing' on Reddit right now"
