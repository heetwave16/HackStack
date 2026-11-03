import { z } from 'zod';
import type { HackStackOutput } from '@/types/hackstack';

const judgingCriterion = z.enum(['Product Thinking', 'Innovation', 'Use of AI', 'Feasibility']);

export const hackStackOutputSchema = z.object({
  projectName: z.string().min(1).max(80),
  tagline: z.string().min(1).max(240),
  validation: z.object({
    schemaValid: z.boolean(),
    compileCheckPassed: z.boolean(),
    usedFallback: z.boolean(),
    modelUsed: z.string().optional()
  }),
  previewApp: z.object({
    primaryEntityName: z.string().min(1).max(120),
    metrics: z.array(z.object({ label: z.string(), value: z.string(), trend: z.string() })).length(3),
    columns: z.array(z.string().min(1)).min(2).max(8),
    sampleRows: z.array(z.record(z.string(), z.string())).min(1).max(10),
    quickActionLabel: z.string().min(1).max(80)
  }),
  codebase: z.object({
    prismaSchema: z.string().min(20),
    apiRouteCode: z.string().min(20),
    starterTestCode: z.string().min(20),
    readmeMarkdown: z.string().min(20)
  }),
  pitchDeck: z
    .array(
      z.object({
        slideNumber: z.number().int().min(1).max(10),
        title: z.string().min(1).max(60),
        headline: z.string().min(1).max(160),
        bullets: z.array(z.string().min(1)).min(1).max(4),
        speakerNote: z.string().min(1).max(400)
      })
    )
    .length(10),
  demoKit: z.object({
    scriptSegments: z
      .array(z.object({ timeRange: z.string(), visualAction: z.string(), voiceover: z.string() }))
      .min(4)
      .max(4),
    buildNextChecklist: z
      .array(
        z.object({
          priority: z.number().int().min(1),
          task: z.string().min(1),
          judgingCriteria: judgingCriterion,
          impactScore: z.string().min(1)
        })
      )
      .min(4)
      .max(6)
  })
});

export type ValidationResult =
  | { success: true; data: HackStackOutput }
  | { success: false; errors: string[] };

export function validateHackStackOutput(data: unknown): ValidationResult {
  const parsed = hackStackOutputSchema.safeParse(data);
  if (parsed.success) return { success: true, data: parsed.data as HackStackOutput };
  return {
    success: false,
    errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
  };
}
