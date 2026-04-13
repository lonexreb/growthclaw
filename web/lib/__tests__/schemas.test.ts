import { describe, it, expect } from "vitest";
import { leadsFileSchema, pipelineStatusSchema } from "../schemas";

describe("leadsFileSchema", () => {
  it("parses valid leads file", () => {
    const valid = {
      metadata: {
        project: "growthclaw",
        version: "1.0",
        last_updated: "2026-04-12T00:00:00Z",
        total_leads: 1,
      },
      leads: [
        {
          id: "rd-001",
          source: "reddit",
          product_name: "TestProduct",
          founder_name: "TestFounder",
          website_url: "https://example.com",
          description: "A test product",
          source_url: "https://reddit.com/r/test",
          found_at: "2026-04-12T00:00:00Z",
          status: "scouted",
        },
      ],
    };
    const result = leadsFileSchema.parse(valid);
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0].product_name).toBe("TestProduct");
  });

  it("rejects missing metadata", () => {
    const invalid = { leads: [] };
    expect(() => leadsFileSchema.parse(invalid)).toThrow();
  });

  it("rejects missing lead fields", () => {
    const invalid = {
      metadata: {
        project: "growthclaw",
        version: "1.0",
        last_updated: null,
        total_leads: 0,
      },
      leads: [{ id: "rd-001" }], // missing required fields
    };
    expect(() => leadsFileSchema.parse(invalid)).toThrow();
  });

  it("allows optional fields to be absent", () => {
    const valid = {
      metadata: {
        project: "growthclaw",
        version: "1.0",
        last_updated: null,
        total_leads: 1,
      },
      leads: [
        {
          id: "rd-001",
          source: "reddit",
          product_name: "Test",
          founder_name: "Founder",
          website_url: "https://test.com",
          description: "Desc",
          source_url: "https://reddit.com/r/test",
          found_at: "2026-04-12T00:00:00Z",
          status: "scouted",
          // no marketing_score, score_breakdown, etc. — all optional
        },
      ],
    };
    const result = leadsFileSchema.parse(valid);
    expect(result.leads[0].marketing_score).toBeUndefined();
  });

  it("passes through extra fields from stages 4-6", () => {
    const valid = {
      metadata: { project: "gc", version: "1.0", last_updated: null, total_leads: 1 },
      leads: [
        {
          id: "rd-001",
          source: "reddit",
          product_name: "Test",
          founder_name: "F",
          website_url: "https://t.com",
          description: "D",
          source_url: "https://r.com",
          found_at: "2026-04-12T00:00:00Z",
          status: "active",
          health_score: 75,
          churn_risk: "low",
        },
      ],
    };
    const result = leadsFileSchema.parse(valid);
    expect((result.leads[0] as Record<string, unknown>).health_score).toBe(75);
  });
});

describe("pipelineStatusSchema", () => {
  it("parses valid status", () => {
    const valid = {
      stage: "scouting",
      started_at: "2026-04-12T00:00:00Z",
      message: "Scouting...",
      detail: "Browsing Reddit...",
      progress: 15,
    };
    const result = pipelineStatusSchema.parse(valid);
    expect(result.stage).toBe("scouting");
    expect(result.progress).toBe(15);
  });

  it("defaults detail and progress when absent", () => {
    const minimal = {
      stage: "idle",
      started_at: null,
      message: "Ready",
    };
    const result = pipelineStatusSchema.parse(minimal);
    expect(result.detail).toBe("");
    expect(result.progress).toBe(0);
  });

  it("rejects missing required fields", () => {
    expect(() => pipelineStatusSchema.parse({})).toThrow();
    expect(() => pipelineStatusSchema.parse({ stage: "idle" })).toThrow();
  });
});
