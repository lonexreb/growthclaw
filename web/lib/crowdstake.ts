import type { UsageSignals } from "./types";

const API_URL = process.env.CROWDSTAKE_API_URL;
const API_KEY = process.env.CROWDSTAKE_API_KEY;

const isConfigured = Boolean(API_URL && API_KEY);

interface SignupResult {
  confirmed: boolean;
  signup_at: string;
  email: string;
}

export async function checkSignup(
  email: string
): Promise<SignupResult | null> {
  if (!isConfigured) return null;

  try {
    const res = await fetch(`${API_URL}/users/lookup?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      confirmed: true,
      signup_at: data.created_at || new Date().toISOString(),
      email: data.email || email,
    };
  } catch {
    return null;
  }
}

export async function getUsageSignals(
  email: string
): Promise<UsageSignals | null> {
  if (!isConfigured) return null;

  try {
    const res = await fetch(`${API_URL}/users/${encodeURIComponent(email)}/usage`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      projects_created: data.projects_created ?? 0,
      credits_used_daily_avg: data.credits_used_daily_avg ?? 0,
      pages_published: data.pages_published ?? 0,
      total_time_minutes: data.total_time_minutes ?? 0,
    };
  } catch {
    return null;
  }
}

export function calculatePqlScore(signals: UsageSignals): "low" | "medium" | "high" {
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

export function isCrowdstakeConfigured(): boolean {
  return isConfigured;
}
