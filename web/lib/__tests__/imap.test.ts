import { describe, it, expect } from "vitest";
import { classifySentiment } from "../imap";

describe("classifySentiment", () => {
  it("classifies positive responses as interested", () => {
    expect(classifySentiment("Sounds good, let's chat!")).toBe("interested");
    expect(classifySentiment("I'm interested in learning more")).toBe("interested");
    expect(classifySentiment("Yes! Sign me up")).toBe("interested");
    expect(classifySentiment("I'd love to try it")).toBe("interested");
    expect(classifySentiment("Can you show me a demo?")).toBe("interested");
  });

  it("classifies negative responses as declined", () => {
    expect(classifySentiment("Not interested, thanks")).toBe("declined");
    expect(classifySentiment("Please stop emailing me")).toBe("declined");
    expect(classifySentiment("Unsubscribe")).toBe("declined");
    expect(classifySentiment("No thanks, not a fit for us")).toBe("declined");
  });

  it("classifies ambiguous responses as question", () => {
    expect(classifySentiment("What features do you offer?")).toBe("question");
    expect(classifySentiment("How much does it cost?")).toBe("question");
    expect(classifySentiment("What is the pricing for your product?")).toBe("question");
  });

  it("handles word boundaries — 'pass' does not match 'pass along'", () => {
    // "pass" as a keyword should NOT match "pass along to my cofounder"
    expect(classifySentiment("I'll pass along to my cofounder")).toBe("question");
  });

  it("decline takes priority over interested keywords", () => {
    // "Yes please remove me" — has "yes" but also "please stop" / unsubscribe intent
    expect(classifySentiment("Please stop contacting me, yes I'm sure")).toBe("declined");
  });

  it("handles empty string as question", () => {
    expect(classifySentiment("")).toBe("question");
  });

  it("is case insensitive", () => {
    expect(classifySentiment("SOUNDS GOOD")).toBe("interested");
    expect(classifySentiment("NOT INTERESTED")).toBe("declined");
  });
});
