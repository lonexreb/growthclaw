import type { UsageSignals, HealthBreakdown } from "./types";

interface HealthResult {
  score: number;
  breakdown: HealthBreakdown;
  risk: "low" | "medium" | "high" | "critical";
}

export function calculateHealthScore(
  signals: UsageSignals,
  openTickets: number = 0
): HealthResult {
  // Login trend: based on credit usage as proxy (no direct login data)
  const loginTrend = Math.min(100, (signals.credits_used_daily_avg / 5) * 100);

  // Feature adoption: projects + pages as proxy
  const featureAdoption = Math.min(
    100,
    ((signals.projects_created * 25) + (signals.pages_published * 25))
  );

  // Credit utilization: % of free tier (5 daily credits)
  const creditUtilization = Math.min(100, (signals.credits_used_daily_avg / 5) * 100);

  // Support health: inverse of open tickets
  const supportHealth = openTickets === 0 ? 100 : openTickets === 1 ? 50 : 0;

  const breakdown: HealthBreakdown = {
    login_trend: Math.round(loginTrend),
    feature_adoption: Math.round(featureAdoption),
    credit_utilization: Math.round(creditUtilization),
    support_health: supportHealth,
  };

  const score = Math.round(
    loginTrend * 0.3 +
    featureAdoption * 0.3 +
    creditUtilization * 0.2 +
    supportHealth * 0.2
  );

  let risk: HealthResult["risk"];
  if (score >= 60) risk = "low";
  else if (score >= 40) risk = "medium";
  else if (score >= 20) risk = "high";
  else risk = "critical";

  return { score, breakdown, risk };
}
