import { NextResponse } from "next/server";
import { readLeads, updateLeadStatus } from "@/lib/leads";
import { checkSignup, getUsageSignals, calculatePqlScore, isCrowdstakeConfigured } from "@/lib/crowdstake";
import { checkConversion, isStripeConfigured } from "@/lib/stripe-client";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET() {
  const data = readLeads();
  const leads = data.leads;

  const trialStarted = leads.filter((l) => l.status === "trial-started").length;
  const onboarding = leads.filter((l) => l.status === "onboarding").length;
  const active = leads.filter((l) => l.status === "active").length;
  const converted = leads.filter((l) => l.converted === true).length;
  const totalMrr = leads.reduce((sum, l) => sum + (l.mrr ?? 0), 0);
  const stalled = leads.filter((l) => l.status === "stalled").length;

  return NextResponse.json({
    crowdstake_configured: isCrowdstakeConfigured(),
    stripe_configured: isStripeConfigured(),
    stats: { trialStarted, onboarding, active, converted, totalMrr, stalled },
  });
}

export async function POST() {
  const data = readLeads();
  const results = {
    signups_confirmed: 0,
    pql_low: 0,
    pql_medium: 0,
    pql_high: 0,
    upgrade_prompts: 0,
    conversions: 0,
    stalled: 0,
    skipped_no_api: false,
  };

  // 1. Check signups for trial-started leads
  const trialLeads = data.leads.filter(
    (l) => l.status === "trial-started" || l.status === "meeting-booked"
  );

  for (const lead of trialLeads) {
    const email = lead.contact_email || lead.crowdstake_email;
    if (!email) continue;

    const signup = await checkSignup(email);
    if (signup?.confirmed) {
      updateLeadStatus(lead.id, {
        signup_confirmed: true,
        signup_at: signup.signup_at,
        crowdstake_email: signup.email,
        status: "onboarding",
      });
      results.signups_confirmed++;
    } else if (lead.sent_at && daysSince(lead.sent_at) >= 14) {
      updateLeadStatus(lead.id, { status: "stalled" });
      results.stalled++;
    } else if (
      lead.sent_at &&
      daysSince(lead.sent_at) >= 7 &&
      !lead.signup_nudge_sent
    ) {
      // Send nudge email
      await sendEmail(
        email,
        `Did you get a chance to try Crowdstake?`,
        `Hey ${lead.founder_name}, just checking in — did you get a chance to try Crowdstake? The free tier takes about 5 minutes to set up: crowdstake.com`
      );
      updateLeadStatus(lead.id, { signup_nudge_sent: true });
    }
  }

  // 2. Monitor usage for onboarding/active leads
  const activeLeads = data.leads.filter(
    (l) => l.status === "onboarding" || l.status === "active"
  );

  for (const lead of activeLeads) {
    const email = lead.crowdstake_email || lead.contact_email;
    if (!email) continue;

    const signals = await getUsageSignals(email);
    if (!signals) {
      results.skipped_no_api = true;
      continue;
    }

    const pqlScore = calculatePqlScore(signals);
    updateLeadStatus(lead.id, {
      usage_signals: signals,
      pql_score: pqlScore,
      pql_triggered_at: new Date().toISOString(),
    });

    if (pqlScore === "low") results.pql_low++;
    else if (pqlScore === "medium") results.pql_medium++;
    else results.pql_high++;

    // High PQL + not yet prompted → send upgrade email
    if (pqlScore === "high" && !lead.upgrade_prompt_sent) {
      await sendEmail(
        email,
        `You're getting great results with Crowdstake`,
        `Hey ${lead.founder_name}, you've been crushing it — ${signals.projects_created} projects, ${signals.pages_published} landing pages generated!\n\nLooks like you're hitting the free tier limits. Core plan ($19/mo) gives you unlimited projects and credits. That's less than the cost of one hour of freelance marketing help.\n\nUpgrade here: crowdstake.com/pricing`
      );
      updateLeadStatus(lead.id, {
        upgrade_prompt_sent: true,
        upgrade_prompt_at: new Date().toISOString(),
      });
      results.upgrade_prompts++;
    }
  }

  // 3. Check Stripe for conversions
  const upgradeCandidates = data.leads.filter(
    (l) => l.upgrade_prompt_sent && !l.converted
  );

  for (const lead of upgradeCandidates) {
    const email = lead.crowdstake_email || lead.contact_email;
    if (!email) continue;

    const conversion = await checkConversion(email);
    if (conversion?.converted) {
      updateLeadStatus(lead.id, {
        converted: true,
        converted_at: conversion.converted_at,
        plan: conversion.plan,
        mrr: conversion.mrr,
        status: "converted",
      });
      results.conversions++;
    }
  }

  return NextResponse.json({
    message: "Conversion check complete",
    results,
  });
}
