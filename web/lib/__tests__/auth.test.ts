import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test requireAuth with different env states
describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when Authorization header is missing", async () => {
    vi.stubEnv("API_SECRET", "test-secret");
    const { requireAuth } = await import("../auth");
    const request = new Request("http://localhost/api/test", { method: "POST" });
    expect(() => requireAuth(request)).toThrow("Missing Authorization header");
  });

  it("throws when token is wrong", async () => {
    vi.stubEnv("API_SECRET", "test-secret");
    const { requireAuth } = await import("../auth");
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(() => requireAuth(request)).toThrow("Invalid API key");
  });

  it("does not throw when token is correct", async () => {
    vi.stubEnv("API_SECRET", "test-secret");
    const { requireAuth } = await import("../auth");
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });
    expect(() => requireAuth(request)).not.toThrow();
  });

  it("throws when API_SECRET is not configured", async () => {
    vi.stubEnv("API_SECRET", "");
    const { requireAuth } = await import("../auth");
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { Authorization: "Bearer anything" },
    });
    expect(() => requireAuth(request)).toThrow("API_SECRET not configured");
  });
});
