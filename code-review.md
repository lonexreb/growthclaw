# Code Review — GrowthClaw Web Dashboard

**Reviewed:** 2026-04-12
**Scope:** All files in `web/` (26 source files)
**Standards:** OWASP Top 10, SOLID principles, production readiness

## Executive Summary

The codebase is well-structured with clean component decomposition, strong TypeScript types, and a solid data model covering the full 6-stage sales lifecycle. However, it has **4 critical**, **6 high**, **11 medium**, **8 low**, and **6 informational** issues that block production deployment. The most serious: no authentication, command injection via pipeline API, race conditions on leads.json, and zero test coverage.

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 6 |
| Medium | 11 |
| Low | 8 |
| Info | 6 |

---

## Critical Issues

### C1. Command Injection / Arbitrary Process Spawning

**File:** `web/app/api/pipeline/route.ts:224-243`
**Category:** Security (OWASP A03: Injection)

The POST handler spawns `openclaw` as a child process with `detached: true` and passes the full `process.env` (including SMTP_PASS, STRIPE_API_KEY, IMAP_PASS). The route has no authentication — anyone on the network can trigger process spawning.

**Impact:** Unauthorized resource-exhausting pipeline runs. Child process gets access to all secrets.
**Fix:** Add authentication middleware. Remove `detached: true`. Filter env vars to only required ones. Add rate limiting.

---

### C2. No Authentication on Any API Route

**Files:** All `web/app/api/*/route.ts`
**Category:** Security (OWASP A01: Broken Access Control)

Every API endpoint is completely unauthenticated. Anyone can:
- Read all lead data including emails
- Approve/skip leads
- Trigger bulk email sending via `POST /api/follow-up`
- Trigger Stripe API calls via `POST /api/convert`
- Spawn server processes via `POST /api/pipeline`

**Impact:** Full unauthorized access. Email spam abuse. Data exfiltration.
**Fix:** Add API key auth at minimum. For production: session-based auth or JWT.

---

### C3. Race Conditions on `leads.json`

**File:** `web/lib/leads.ts:14-47`
**Category:** Data Integrity

`readLeads()` and `writeLeads()` use synchronous fs operations with no locking. `updateLeadStatus()` does read-modify-write with no atomicity. The follow-up route calls it in a loop — 50+ read-write cycles per request. Concurrent requests will lose updates.

**Impact:** Lead data corruption, lost updates, inconsistent state.
**Fix:** Use file locking (`proper-lockfile`), or switch to SQLite, or read once → modify all → write once.

---

### C4. Stripe API Without Official SDK

**File:** `web/lib/stripe-client.ts:23-26`
**Category:** Security (OWASP A02: Sensitive Data Exposure)

Raw `fetch` calls to Stripe API instead of the official `stripe` npm package. Bypasses SDK-level protections (retries, idempotency, rate limiting, webhook verification). Email addresses appear in URL query strings (logged by CDNs, proxies).

**Impact:** Missing SDK protections could lead to duplicate charges. Emails in access logs.
**Fix:** Use the official `stripe` npm package.

---

## High Issues

### H1. Email Sending Without Error Handling

**Files:** `follow-up/route.ts:62,80,96,112` | `convert/route.ts:67,101` | `success/route.ts:55,62,68,139`
**Category:** Error Handling & Resilience

Every `await sendEmail(...)` call lacks try/catch. A single SMTP failure crashes the entire request mid-loop, leaving leads in inconsistent states (some updated, some not).

**Impact:** One bad email kills the entire follow-up cycle. Partial state corruption.
**Fix:** Wrap each `sendEmail` in try/catch, log error, add to `results.errors`, continue.

---

### H2. Non-Null Assertions on `contact_email`

**File:** `follow-up/route.ts:80,96,112`
**Category:** TypeScript Quality

`lead.contact_email!` used without null checks in follow-up stages. The initial send checks for null, but there's no guarantee the field persists through subsequent stages.

**Impact:** Runtime crash if `contact_email` is null/undefined.
**Fix:** Add null checks before each email send.

---

### H3. No Input Validation on POST /api/leads

**File:** `web/app/api/leads/route.ts:18-21`
**Category:** Security / Data Integrity

`request.json()` cast directly with `as { id: string; action: "approve" | "skip" }`. No runtime validation. Invalid payloads pass silently.

**Impact:** Unexpected data types propagate through the system.
**Fix:** Use Zod: `z.object({ id: z.string(), action: z.enum(["approve", "skip"]) })`.

---

### H4. Detached Child Process Never Cleaned Up

**File:** `web/app/api/pipeline/route.ts:224-243`
**Category:** DevOps

Process spawned with `detached: true` but no `unref()` and no SIGTERM/SIGINT handler. Orphaned processes persist after server crash.

**Impact:** Zombie processes consuming resources.
**Fix:** Add process cleanup handlers. Either use `detached: true` + `unref()` or remove `detached`.

---

### H5. `readLeads` Retry Is Useless

**File:** `web/lib/leads.ts:14-28`
**Category:** Error Handling

The "retry" re-reads synchronously with no delay. If the file is mid-write, the immediate retry reads the same partial content.

**Impact:** False confidence. The retry solves nothing.
**Fix:** Use file locking, or add a delay between retries, or use `fs.watch`.

---

### H6. Unbounded Email Body from IMAP

**File:** `web/lib/imap.ts:63`
**Category:** Security / Performance

`msg.source?.toString("utf-8")` reads the entire RFC822 source (including attachments) into memory before slicing to 2000 chars.

**Impact:** OOM from a single large email with attachments.
**Fix:** Use `bodyParts` option to fetch only text/plain, not `source: true`.

---

## Medium Issues

### M1. `daysSince` Function Duplicated Three Times

**Files:** `follow-up/route.ts:11` | `convert/route.ts:9` | `success/route.ts:9`
**Category:** Code Quality (DRY)

Identical function copy-pasted into three files.

**Fix:** Extract to `lib/utils.ts`.

---

### M2. Module-Level Side Effects in Pipeline Route

**File:** `web/app/api/pipeline/route.ts:167-190`
**Category:** Architecture

Module-level code reads/writes state files on import. Unpredictable in serverless or during HMR.

**Fix:** Move to a lazy initialization function called from handlers.

---

### M3. Mutable Module-Level `currentProcess`

**File:** `web/app/api/pipeline/route.ts:51`
**Category:** Architecture

In-memory variable won't persist across serverless invocations. Concurrency check relies on it.

**Fix:** Rely solely on PID file for concurrency control.

---

### M4. Dead Code: Unused `PRODUCT_URL`

**File:** `web/app/api/follow-up/route.ts:9`
**Category:** Code Quality

Declared but never referenced.

**Fix:** Remove it.

---

### M5. Dead Import: Unused `Zap` Icon

**File:** `web/components/header.tsx:4`
**Category:** Code Quality

`Zap` imported from lucide-react but never used.

**Fix:** Remove the import.

---

### M6. `console.error` in Production Client Code

**File:** `web/app/page.tsx:35,47`
**Category:** DevOps

Client-side `console.error` provides no server-side observability.

**Fix:** Use error reporting service (Sentry) or surface in UI.

---

### M7. No Rate Limiting on Email Endpoints

**Files:** `follow-up/route.ts` | `convert/route.ts` | `success/route.ts`
**Category:** Security

No rate limiting. Rapid POST calls could send hundreds of emails.

**Fix:** Add rate limiting or cooldown tracking.

---

### M8. Fragile Sentiment Classification

**File:** `web/lib/imap.ts:24-29`
**Category:** Data Integrity

Keyword matching catches false positives: "pass" matches "I'll pass along to my cofounder" (interested → marked declined). "Yes" matches "Yes please remove me."

**Fix:** Use LLM for classification, or use word-boundary regex.

---

### M9. No Env Var Validation at Startup

**Files:** `lib/email.ts` | `lib/imap.ts` | `lib/integration.ts` | `lib/stripe-client.ts`
**Category:** DevOps

Variables checked only when functions are called. Missing SMTP_HOST surfaces hours into a run.

**Fix:** Validate all required env vars at startup in a shared `lib/config.ts`.

---

### M10. N+1 File I/O in Follow-Up Processing

**File:** `web/app/api/follow-up/route.ts:52-127`
**Category:** Performance

`updateLeadStatus` re-reads and re-writes `leads.json` on every iteration. 50+ read-write cycles per request.

**Fix:** Read once, modify in memory, write once.

---

### M11. State Update on Unmounted Component

**File:** `web/app/page.tsx:62-81`
**Category:** Performance

Polling callback calls `fetchLeads()` after detecting done/error, but the component may have unmounted between the check and the fetch.

**Fix:** Use AbortController or mounted ref to guard the final fetch.

---

## Low Issues

| # | File | Issue |
|---|------|-------|
| L1 | `api/leads/route.ts:20` | Type assertion instead of runtime validation |
| L2 | `lib/leads.ts:17` | `JSON.parse() as LeadsFile` with no schema check |
| L3 | `api/pipeline/route.ts:41` | Same `JSON.parse() as` pattern for pipeline state |
| L4 | `follow-up/route.ts:52,75,89,108` | Magic number `10` for batch size — use named constant |
| L5 | `lib/leads.ts:7` | `process.cwd()` assumption — breaks if started from wrong dir |
| L6 | `layout.tsx:23` | `suppressHydrationWarning` masks genuine hydration bugs |
| L7 | `layout.tsx:24` + `page.tsx:171` + `globals.css:105` | `bg-gc-bg` set in three places |
| L8 | `api/pipeline/route.ts:79-153` | `extractDetail` has 12+ regex patterns — complex and fragile |

---

## Info / Accessibility

| # | Issue | Fix |
|---|-------|-----|
| I1 | No CSRF protection on POST routes | Add when auth is implemented |
| I2 | No `/api/health` endpoint | Add health check for monitoring |
| I3 | Activity log hidden on <1280px screens (`hidden xl:block`) | Add mobile drawer/tab |
| I4 | No ARIA labels on icon-only elements (external link icons) | Add `aria-label` |
| I5 | No keyboard navigation on pipeline stepper / SVG logo | Add `tabIndex` and focus styles |
| I6 | `.env.example` exists but I3 in original review noted it missing | Confirmed it exists, but missing `SENDER_NAME`, `PHYSICAL_ADDRESS` docs |

---

## What's Done Well

1. **Clean type system** — `lib/types.ts` with 30 lead statuses, discriminated interfaces for FollowUp, Reply, UsageSignals, HealthBreakdown. Excellent data modeling.

2. **CAN-SPAM compliance** — Physical address + unsubscribe in every email. Configurable via env vars.

3. **Human-in-the-loop** — Approve/skip workflow ensures no automated outreach goes out without human review.

4. **PID-based process recovery** — Pipeline state persisted to disk with PID tracking for HMR resilience.

5. **Component composition** — ScoreGauge, ScoreBreakdown, OutreachDraft, FollowUpTimeline, FunnelChart are single-responsibility with clean props.

6. **Health score algorithm** — Weighted scoring with extensible dimensions. PQL scoring is clean and tunable.

7. **Progressive UI** — Animated pipeline stepper, SVG gauge, funnel chart — polished for demo.

8. **`force-dynamic` on all routes** — Prevents Next.js from caching dynamic data.

9. **Product-agnostic integration layer** — `integration.ts` with pluggable `PRODUCT_API_URL` makes GrowthClaw work with any SaaS.

10. **Actionable error messages** — "SMTP not configured. Set SMTP_HOST..." tells you exactly what to do.

---

## Top 5 Priorities for Production

| # | What | Why | Effort |
|---|------|-----|--------|
| 1 | Add authentication to all API routes | Anyone can trigger emails, read data, spawn processes | 2-4 hrs |
| 2 | Replace leads.json with SQLite | Race conditions, N+1 I/O, no locking, no ACID | 4-6 hrs |
| 3 | Add Zod validation on all API inputs | Type assertions provide zero runtime safety | 2 hrs |
| 4 | Wrap sendEmail in try/catch everywhere | One SMTP failure crashes entire cycle | 1 hr |
| 5 | Add test suite (Vitest + Playwright) | Zero tests — no regression protection | 4-8 hrs |

---

## Testing Status

**Zero tests exist.** No test framework configured. The pure functions (`daysSince`, `calculatePqlScore`, `calculateHealthScore`, `classifySentiment`) are straightforward to unit test. API routes can be tested with Next.js test utilities.

**Recommended setup:** Vitest for unit/integration tests, Playwright for E2E.
