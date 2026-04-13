import { describe, it, expect } from "vitest";
import { calculateHealthScore } from "../health-score";

describe("calculateHealthScore", () => {
  it("returns high score and low risk for perfect usage", () => {
    const result = calculateHealthScore({
      projects_created: 5,
      credits_used_daily_avg: 5,
      pages_published: 4,
      total_time_minutes: 120,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.risk).toBe("low");
  });

  it("returns low score and high risk for zero usage", () => {
    const result = calculateHealthScore({
      projects_created: 0,
      credits_used_daily_avg: 0,
      pages_published: 0,
      total_time_minutes: 0,
    });
    // support_health defaults to 100 (no tickets), so not critical
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.risk).toBe("high");
  });

  it("returns medium risk for mixed usage", () => {
    const result = calculateHealthScore({
      projects_created: 1,
      credits_used_daily_avg: 2,
      pages_published: 1,
      total_time_minutes: 15,
    });
    expect(result.risk).toMatch(/low|medium/);
  });

  it("reduces support_health with open tickets", () => {
    const withoutTickets = calculateHealthScore(
      { projects_created: 2, credits_used_daily_avg: 3, pages_published: 1, total_time_minutes: 30 },
      0
    );
    const withTickets = calculateHealthScore(
      { projects_created: 2, credits_used_daily_avg: 3, pages_published: 1, total_time_minutes: 30 },
      3
    );
    expect(withTickets.score).toBeLessThan(withoutTickets.score);
    expect(withTickets.breakdown.support_health).toBe(0);
    expect(withoutTickets.breakdown.support_health).toBe(100);
  });

  it("returns critical risk for zero usage with tickets", () => {
    const result = calculateHealthScore(
      { projects_created: 0, credits_used_daily_avg: 0, pages_published: 0, total_time_minutes: 0 },
      5
    );
    expect(result.risk).toBe("critical");
  });
});
