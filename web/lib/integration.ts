import type { UsageSignals } from "./types";

/**
 * Product integration interface.
 *
 * GrowthClaw is product-agnostic. This module provides a pluggable
 * integration layer for checking signups, usage, and conversions
 * against any SaaS product's API.
 *
 * To add a new integration, implement these functions and set the
 * PRODUCT_API_URL + PRODUCT_API_KEY env vars.
 */

const API_URL = process.env.PRODUCT_API_URL;
const API_KEY = process.env.PRODUCT_API_KEY;

interface SignupResult {
  confirmed: boolean;
  signup_at: string;
  email: string;
}

function requireConfig(): void {
  if (!API_URL || !API_KEY) {
    throw new Error(
      "Product API not configured. Set PRODUCT_API_URL and PRODUCT_API_KEY in .env.local"
    );
  }
}

export async function checkSignup(email: string): Promise<SignupResult | null> {
  requireConfig();

  const res = await fetch(
    `${API_URL}/users/lookup?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  return {
    confirmed: true,
    signup_at: data.created_at || new Date().toISOString(),
    email: data.email || email,
  };
}

export async function getUsageSignals(
  email: string
): Promise<UsageSignals | null> {
  requireConfig();

  const res = await fetch(
    `${API_URL}/users/${encodeURIComponent(email)}/usage`,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  return {
    projects_created: data.projects_created ?? 0,
    credits_used_daily_avg: data.credits_used_daily_avg ?? 0,
    pages_published: data.pages_published ?? 0,
    total_time_minutes: data.total_time_minutes ?? 0,
  };
}

export function calculatePqlScore(
  signals: UsageSignals
): "low" | "medium" | "high" {
  let points = 0;
  if (signals.projects_created >= 2) points += 2;
  else if (signals.projects_created >= 1) points += 1;
  if (signals.credits_used_daily_avg >= 4) points += 2;
  else if (signals.credits_used_daily_avg >= 1) points += 1;
  if (signals.pages_published >= 2) points += 2;
  else if (signals.pages_published >= 1) points += 1;
  if (signals.total_time_minutes >= 30) points += 2;
  else if (signals.total_time_minutes >= 10) points += 1;

  if (points >= 6) return "high";
  if (points >= 3) return "medium";
  return "low";
}
