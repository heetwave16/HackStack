/**
 * JEV (TypeSafe AI "System One") integration.
 *
 * JEV is a machine-native decision engine: it skips natural-language generation
 * entirely and returns structured, type-safe choices + calibrated confidence
 * probabilities in 70–500 ms. It never produces freeform text.
 *
 * In HackStack, JEV is used as a lightweight pre-flight classifier that runs
 * BEFORE the expensive LLM generation call. It answers two questions quickly:
 *
 *   1. Is the idea safe/appropriate to generate? (content safety gate)
 *   2. Which provider/model is best suited for this idea's complexity?
 *
 * When JEV is not configured (no API key), all calls return safe conservative
 * defaults and generation continues normally — JEV is strictly optional.
 *
 * JEV never sees or stores API keys from other providers.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const JevSafetyDecisionSchema = z.enum([
  "allow",        // idea is appropriate; proceed with generation
  "allow_warn",   // allowed but surface a note (e.g., very vague brief)
  "block",        // inappropriate content; do not generate
]);
export type JevSafetyDecision = z.infer<typeof JevSafetyDecisionSchema>;

export const JevModelRecommendationSchema = z.enum([
  "openrouter/free",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gpt-4o-mini",
]);
export type JevModelRecommendation = z.infer<
  typeof JevModelRecommendationSchema
>;

export const JevClassificationSchema = z.object({
  safety: JevSafetyDecisionSchema,
  safetyConfidence: z.number().min(0).max(1),
  safetyNote: z.string().optional(),
  recommendedModel: JevModelRecommendationSchema,
  modelConfidence: z.number().min(0).max(1),
  ideaComplexity: z.enum(["simple", "moderate", "complex"]),
  latencyMs: z.number().nonnegative(),
  source: z.enum(["jev", "fallback"]),
});
export type JevClassification = z.infer<typeof JevClassificationSchema>;

// ---------------------------------------------------------------------------
// Local conservative fallback (no network call)
// ---------------------------------------------------------------------------

/** Fast heuristic classifier that runs entirely in-process when JEV is absent. */
function localClassify(idea: string): JevClassification {
  const lower = idea.toLowerCase();
  const wordCount = idea.trim().split(/\s+/).length;

  // Basic content safety: flag obviously harmful keywords.
  const harmfulKeywords = [
    "weapon",
    "bomb",
    "hack into",
    "ddos",
    "phishing",
    "malware",
    "ransomware",
    "exploit",
    "bypass security",
    "steal credentials",
    "illegal",
    "dark web",
  ];
  const isHarmful = harmfulKeywords.some((keyword) => lower.includes(keyword));
  if (isHarmful) {
    return {
      safety: "block",
      safetyConfidence: 0.9,
      safetyNote:
        "The idea appears to describe harmful or prohibited activity and cannot be generated.",
      recommendedModel: "openrouter/free",
      modelConfidence: 0.5,
      ideaComplexity: "simple",
      latencyMs: 0,
      source: "fallback",
    };
  }

  // Vague brief detection.
  if (wordCount < 5) {
    return {
      safety: "allow_warn",
      safetyConfidence: 0.85,
      safetyNote:
        "Your idea is very short. Two sentences describing who has the problem and what the app does will produce much better results.",
      recommendedModel: "openrouter/free",
      modelConfidence: 0.6,
      ideaComplexity: "simple",
      latencyMs: 0,
      source: "fallback",
    };
  }

  // Complexity estimation for model routing.
  const complexitySignals = [
    "real-time",
    "websocket",
    "ml",
    "machine learning",
    "computer vision",
    "autonomous",
    "blockchain",
    "iot",
    "telemetry",
    "multi-tenant",
    "recommendation",
    "natural language",
    "speech",
    "video",
    "streaming",
    "distributed",
  ];
  const complexCount = complexitySignals.filter((signal) =>
    lower.includes(signal),
  ).length;

  const ideaComplexity =
    complexCount >= 3 ? "complex" : complexCount >= 1 ? "moderate" : "simple";

  // Route complex ideas to a more capable free model.
  const recommendedModel: JevModelRecommendation =
    ideaComplexity === "complex" ? "gemini-3.5-flash" : "openrouter/free";

  return {
    safety: "allow",
    safetyConfidence: 0.8,
    recommendedModel,
    modelConfidence: 0.7,
    ideaComplexity,
    latencyMs: 0,
    source: "fallback",
  };
}

// ---------------------------------------------------------------------------
// JEV API client (called when JEV_API_KEY is configured)
// ---------------------------------------------------------------------------

const JEV_API_URL =
  process.env.JEV_API_URL ?? "https://api.typesafe.ai/v1/classify";

/** Raw shape returned by TypeSafe AI's classification endpoint. */
const jevRawResponseSchema = z.object({
  decision: z.string(),
  confidence: z.number(),
  note: z.string().optional(),
  features: z
    .object({
      recommended_model: z.string().optional(),
      model_confidence: z.number().optional(),
      complexity: z.string().optional(),
    })
    .optional(),
});

async function callJevApi(
  idea: string,
  apiKey: string,
): Promise<JevClassification> {
  const startedAt = Date.now();
  const response = await fetch(JEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      task: "hackstack_input_safety_v1",
      inputs: { idea },
      schema: {
        decision: ["allow", "allow_warn", "block"],
        features: ["recommended_model", "model_confidence", "complexity"],
      },
    }),
    redirect: "error",
    signal: AbortSignal.timeout(600), // JEV targets 70–500 ms; 600 ms hard cap
  });

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    throw new Error(`JEV returned HTTP ${response.status}`);
  }

  const raw = jevRawResponseSchema.safeParse(await response.json());
  if (!raw.success) throw new Error("JEV returned an unexpected shape");

  const safety = JevSafetyDecisionSchema.safeParse(raw.data.decision);
  const recommendedModel = JevModelRecommendationSchema.safeParse(
    raw.data.features?.recommended_model ?? "openrouter/free",
  );

  return {
    safety: safety.success ? safety.data : "allow",
    safetyConfidence: raw.data.confidence,
    safetyNote: raw.data.note,
    recommendedModel: recommendedModel.success
      ? recommendedModel.data
      : "openrouter/free",
    modelConfidence: raw.data.features?.model_confidence ?? 0.5,
    ideaComplexity:
      raw.data.features?.complexity === "complex"
        ? "complex"
        : raw.data.features?.complexity === "moderate"
          ? "moderate"
          : "simple",
    latencyMs,
    source: "jev",
  };
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/**
 * Classifies a hackathon idea using JEV when configured, or falls back to a
 * local heuristic that runs in-process with zero latency.
 *
 * This call is non-throwing: any JEV API error silently falls back to the
 * local classifier. Generation is never blocked by a JEV failure.
 */
export async function classifyIdea(idea: string): Promise<JevClassification> {
  const apiKey = process.env.JEV_API_KEY?.trim();
  if (apiKey) {
    try {
      return await callJevApi(idea, apiKey);
    } catch {
      // JEV failure is non-fatal; degrade silently to local classifier.
    }
  }
  return localClassify(idea);
}

/**
 * Returns true when the classification allows generation to proceed.
 * "allow_warn" is allowed; callers should surface safetyNote to the user.
 */
export function isGenerationAllowed(
  classification: JevClassification,
): boolean {
  return (
    classification.safety === "allow" ||
    classification.safety === "allow_warn"
  );
}
