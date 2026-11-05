/**
 * JEV classifier unit tests.
 *
 * These tests verify the local heuristic fallback that runs when JEV is not
 * configured.  No network calls are made.  TypeSafe AI API integration is
 * exercised separately via a live test account (not automated in CI).
 */

import { describe, expect, it } from "vitest";
import { classifyIdea, isGenerationAllowed } from "../jev";

describe("JEV local fallback classifier", () => {
  describe("safety gate", () => {
    it("allows a normal hackathon idea", async () => {
      const result = await classifyIdea(
        "Peer-to-peer UPI textbook exchange for engineering students.",
      );
      expect(result.safety).toBe("allow");
      expect(result.source).toBe("fallback");
      expect(isGenerationAllowed(result)).toBe(true);
    });

    it("blocks an idea with an explicit harmful keyword", async () => {
      const result = await classifyIdea(
        "Build a tool to create malware that bypasses antivirus security.",
      );
      expect(result.safety).toBe("block");
      expect(isGenerationAllowed(result)).toBe(false);
      expect(result.safetyNote).toBeTruthy();
    });

    it("warns on an extremely short idea (< 5 words)", async () => {
      const result = await classifyIdea("app");
      expect(result.safety).toBe("allow_warn");
      expect(isGenerationAllowed(result)).toBe(true); // allow_warn still proceeds
      expect(result.safetyNote).toBeTruthy();
    });

    it("allows a vague but non-harmful idea with a warning note", async () => {
      const result = await classifyIdea("todo list");
      // Could be allow or allow_warn depending on word count; must NOT block
      expect(["allow", "allow_warn"]).toContain(result.safety);
      expect(isGenerationAllowed(result)).toBe(true);
    });
  });

  describe("complexity routing", () => {
    it("classifies a simple idea as simple", async () => {
      const result = await classifyIdea(
        "A platform where students can share lecture notes and study materials.",
      );
      expect(result.ideaComplexity).toBe("simple");
    });

    it("classifies an idea with real-time and IoT signals as complex", async () => {
      const result = await classifyIdea(
        "Real-time IoT cold-chain telemetry for autonomous medical drone corridors with machine learning anomaly detection.",
      );
      expect(result.ideaComplexity).toBe("complex");
      // Complex ideas should be routed to a more capable model
      expect(result.recommendedModel).not.toBe("openrouter/free");
    });

    it("classifies a moderate idea correctly", async () => {
      const result = await classifyIdea(
        "Recommendation engine for campus food delivery based on hostel floor preferences.",
      );
      expect(result.ideaComplexity).toBe("moderate");
    });
  });

  describe("confidence scores", () => {
    it("returns confidence values between 0 and 1", async () => {
      const result = await classifyIdea(
        "Hostel bill splitting app with UPI integration.",
      );
      expect(result.safetyConfidence).toBeGreaterThanOrEqual(0);
      expect(result.safetyConfidence).toBeLessThanOrEqual(1);
      expect(result.modelConfidence).toBeGreaterThanOrEqual(0);
      expect(result.modelConfidence).toBeLessThanOrEqual(1);
    });

    it("reports zero latency for the local fallback", async () => {
      const result = await classifyIdea("Drone delivery app for campuses.");
      expect(result.latencyMs).toBe(0);
      expect(result.source).toBe("fallback");
    });
  });
});
