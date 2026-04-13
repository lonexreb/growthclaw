import { describe, it, expect } from "vitest";
import { daysSince, MAX_EMAILS_PER_BATCH } from "../utils";

describe("daysSince", () => {
  it("returns ~1 for a date 1 day ago", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = daysSince(yesterday);
    expect(result).toBeGreaterThanOrEqual(0.99);
    expect(result).toBeLessThanOrEqual(1.01);
  });

  it("returns ~7 for a date 7 days ago", () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = daysSince(weekAgo);
    expect(result).toBeGreaterThanOrEqual(6.99);
    expect(result).toBeLessThanOrEqual(7.01);
  });

  it("returns ~0 for now", () => {
    const now = new Date().toISOString();
    expect(daysSince(now)).toBeCloseTo(0, 1);
  });

  it("returns negative for future date", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(tomorrow)).toBeLessThan(0);
  });
});

describe("MAX_EMAILS_PER_BATCH", () => {
  it("is 10", () => {
    expect(MAX_EMAILS_PER_BATCH).toBe(10);
  });
});
