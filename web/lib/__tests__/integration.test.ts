import { describe, it, expect } from "vitest";
import { calculatePqlScore } from "../integration";

describe("calculatePqlScore", () => {
  it("returns 'low' for zero usage", () => {
    expect(calculatePqlScore({
      projects_created: 0,
      credits_used_daily_avg: 0,
      pages_published: 0,
      total_time_minutes: 0,
    })).toBe("low");
  });

  it("returns 'medium' for moderate usage", () => {
    expect(calculatePqlScore({
      projects_created: 1,
      credits_used_daily_avg: 2,
      pages_published: 1,
      total_time_minutes: 15,
    })).toBe("medium");
  });

  it("returns 'high' for power usage", () => {
    expect(calculatePqlScore({
      projects_created: 3,
      credits_used_daily_avg: 5,
      pages_published: 2,
      total_time_minutes: 60,
    })).toBe("high");
  });

  it("returns 'low' for minimal single-signal usage", () => {
    expect(calculatePqlScore({
      projects_created: 1,
      credits_used_daily_avg: 0,
      pages_published: 0,
      total_time_minutes: 5,
    })).toBe("low");
  });

  it("handles exact thresholds correctly", () => {
    // Exactly 1 project (1pt), exactly 1 credit (1pt), exactly 1 page (1pt) = 3 → medium
    expect(calculatePqlScore({
      projects_created: 1,
      credits_used_daily_avg: 1,
      pages_published: 1,
      total_time_minutes: 0,
    })).toBe("medium");
  });
});
