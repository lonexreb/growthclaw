import { NextResponse } from "next/server";
import { readLeads, updateLeadStatus } from "@/lib/leads";
import { getUsageSignals } from "@/lib/integration";
import { calculateHealthScore } from "@/lib/health-score";
import { sendEmail } from "@/lib/email";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { daysSince } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = readLeads();
  const leads = data.leads;

  const active = leads.filter((l) => l.status === "active").length;
  const onboarding = leads.filter((l) => l.status === "onboarding").length;
  const churning = leads.filter((l) => l.status === "churning").length;
  const expansionReady = leads.filter((l) => l.status === "expansion-ready").length;
  const healthLeads = leads.filter((l) => l.health_score != null);
  const avgHealth = healthLeads.length > 0
    ? Math.round(healthLeads.reduce((s, l) => s + (l.health_score ?? 0), 0) / healthLeads.length)
    : 0;
  const totalLtv = leads.reduce((s, l) => s + (l.lifetime_value ?? 0), 0);

  return NextResponse.json({
    stats: { active, onboarding, churning, expansionReady, avgHealth, totalLtv },
  });
}

export async function POST(request: Request) {
  try { requireAuth(request); } catch (err) { return handleAuthError(err); }
  const data = readLeads();
  const results = {
    onboarding_emails: 0,
    health_checks: 0,
    churn_alerts: 0,
    expansion_triggers: 0,
    nps_sent: 0,
  };

  // 1. Onboarding sequences for recent converts
  const onboardingLeads = data.leads.filter(
    (l) => l.status === "converted" || l.status === "onboarding"
  );

  for (const lead of onboardingLeads) {
    const email = lead.crowdstake_email || lead.contact_email;
    if (!email) continue;

    const days = lead.converted_at ? daysSince(lead.converted_at) : 0;
    const stage = lead.onboarding_stage || "";

    try {
      if (days >= 0 && days < 1 && stage !== "day-0") {
        await sendEmail(email, `Welcome, ${lead.founder_name}!`,
          `Congrats on upgrading! Here's how to get the most out of your first week:\n\n1. Start your first project for ${lead.product_name}\n2. Generate a landing page with conversion-optimized copy\n3. Set up demand capture to start collecting emails\n\nQuestions? Just reply to this email.`
        );
        updateLeadStatus(lead.id, { onboarding_stage: "day-0", status: "onboarding" });
        results.onboarding_emails++;
      } else if (days >= 3 && days < 4 && stage === "day-0") {
        const gap = lead.outreach_hero_gap || "your marketing";
        await sendEmail(email, `Have you tried the AI Marketing Consultant yet?`,
          `Hey ${lead.founder_name}, the AI Marketing Consultant would be perfect for fixing ${gap}. Give it a try — it takes about 2 minutes.`
        );
        updateLeadStatus(lead.id, { onboarding_stage: "day-3" });
        results.onboarding_emails++;
      } else if (days >= 7 && days < 8 && stage === "day-3") {
        await sendEmail(email, `How's it going?`,
          `Hey ${lead.founder_name}, you're one week in! Just wanted to check — have you had a chance to generate a landing page for ${lead.product_name}? If you're stuck on anything, reply here and I'll help.`
        );
        updateLeadStatus(lead.id, { onboarding_stage: "day-7" });
        results.onboarding_emails++;
      } else if (days >= 14 && stage === "day-7") {
        updateLeadStatus(lead.id, { onboarding_stage: "complete", status: "active" });
        results.onboarding_emails++;
      }
    } catch { /* onboarding email failed — continue with next lead */ }
  }

  // 2. Health scoring for active customers
  const activeLeads = data.leads.filter(
    (l) => l.status === "active" || l.status === "expansion-ready"
  );

  for (const lead of activeLeads) {
    const email = lead.crowdstake_email || lead.contact_email;
    if (!email) continue;

    const signals = await getUsageSignals(email);
    if (!signals) continue;

    const health = calculateHealthScore(signals);
    updateLeadStatus(lead.id, {
      health_score: health.score,
      health_breakdown: health.breakdown,
      health_checked_at: new Date().toISOString(),
      churn_risk: health.risk,
      usage_signals: signals,
    });
    results.health_checks++;

    if (health.risk === "high" || health.risk === "critical") {
      updateLeadStatus(lead.id, {
        status: "churning",
        churn_risk_reason: `Health score ${health.score}/100 — low engagement`,
      });
      results.churn_alerts++;
    }

    if (
      health.risk === "low" &&
      signals.credits_used_daily_avg >= 4 &&
      signals.projects_created >= 2 &&
      !lead.expansion_opportunity
    ) {
      updateLeadStatus(lead.id, {
        status: "expansion-ready",
        expansion_opportunity: "plan-upgrade",
        expansion_type: lead.plan === "core" ? "core-to-growth" : "growth-to-pro",
        expansion_suggested_at: new Date().toISOString(),
      });
      results.expansion_triggers++;
    }
  }

  // 3. NPS surveys at milestones
  const npsTargets = data.leads.filter(
    (l) =>
      (l.status === "active" || l.status === "expansion-ready") &&
      l.converted_at &&
      !l.nps_score
  );

  for (const lead of npsTargets) {
    const days = daysSince(lead.converted_at!);
    const email = lead.crowdstake_email || lead.contact_email;
    if (!email) continue;

    if (days >= 30 && days < 31) {
      try {
        await sendEmail(email, `Quick question`,
          `Hey ${lead.founder_name}, quick question: On a scale of 0-10, how likely are you to recommend us to a fellow founder?\n\nReply with just a number. We read every response.`
        );
        results.nps_sent++;
      } catch { /* NPS email failed — continue */ }
    }
  }

  return NextResponse.json({ message: "Success check complete", results });
}
