import { z } from 'zod';
import type { HackStackOutput } from '@/types/hackstack';

/**
 * StudioResult: the single data contract every tab renders from.
 * Presets, the live API and the offline builder all end up as this type.
 */

export const ToneSchema = z.enum(['success', 'info', 'warning', 'neutral', 'danger']);
export type Tone = z.infer<typeof ToneSchema>;

export const FieldTypeSchema = z.enum(['text', 'number', 'currency', 'status', 'id']);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const EntityFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: FieldTypeSchema,
  /** For status fields: lowercase keyword -> tone. First keyword found in the value wins. */
  toneMap: z.record(z.string(), ToneSchema).optional()
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const ResultSourceSchema = z.enum(['live', 'retry', 'fallback-model', 'cached', 'offline']);
export type ResultSource = z.infer<typeof ResultSourceSchema>;

export const StudioResultSchema = z.object({
  meta: z.object({ id: z.string().min(1), name: z.string().min(1), tagline: z.string() }),
  entity: z.object({
    name: z.string().min(1),
    fields: z.array(EntityFieldSchema).min(1)
  }),
  rows: z.array(z.record(z.string(), z.string())),
  sampleData: z.boolean(),
  metrics: z.array(
    z.object({ label: z.string(), value: z.string(), delta: z.string(), tone: ToneSchema })
  ),
  primaryAction: z.object({
    label: z.string().min(1),
    fields: z.array(EntityFieldSchema)
  }),
  files: z.array(z.object({ path: z.string().min(1), language: z.string(), content: z.string() })),
  slides: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      headline: z.string(),
      bullets: z.array(z.string()),
      notes: z.string()
    })
  ),
  script: z.array(z.object({ timeRange: z.string(), action: z.string(), voiceover: z.string() })),
  rubric: z.array(
    z.object({ priority: z.number(), task: z.string(), criterion: z.string(), impact: z.string() })
  ),
  source: ResultSourceSchema,
  latencyMs: z.number().nullable(),
  validation: z.object({
    schemaValid: z.boolean(),
    compileCheckPassed: z.boolean(),
    modelUsed: z.string().optional()
  })
});
export type StudioResult = z.infer<typeof StudioResultSchema>;

/** Optional per-preset data that refines how the entity is rendered. Data only, no JSX. */
export interface EntityOverride {
  fields?: Partial<Record<string, Partial<Omit<EntityField, 'key'>>>>;
}

const ACRONYMS = new Set(['id', 'upi', 'eta', 'isbn', 'url', 'api', 'ai', 'gps']);

/** "etaMinutes" -> "ETA minutes", "hostel_wing" -> "Hostel wing". */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.toLowerCase()));
  if (words.length === 0) return key;
  if (!ACRONYMS.has(words[0].toLowerCase())) words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(' ');
}

const DEFAULT_TONES: Record<string, Tone> = {
  delivered: 'success', verified: 'success', clear: 'success', locked: 'success', complete: 'success', paid: 'success',
  flight: 'info', pooling: 'info', open: 'info', active: 'info', listed: 'info',
  preparing: 'warning', pending: 'warning', review: 'warning', delayed: 'warning',
  failed: 'danger', cancelled: 'danger', disputed: 'danger'
};

export function inferFieldType(key: string, values: string[]): FieldType {
  if (/status|state/i.test(key)) return 'status';
  if (/(^id$|Id$|_id$)/.test(key)) return 'id';
  const nonEmpty = values.filter(Boolean);
  if (nonEmpty.length && nonEmpty.every((v) => /^[₹$€£]\s?[\d,.]+$/.test(v.trim()))) return 'currency';
  if (nonEmpty.length && nonEmpty.every((v) => /^[\d,.]+(\s?[a-z%°]+)?$/i.test(v.trim()))) return 'number';
  return 'text';
}

export function toneForValue(value: string, field: Pick<EntityField, 'toneMap'>): Tone {
  const lower = value.toLowerCase();
  const map = { ...DEFAULT_TONES, ...(field.toneMap ?? {}) };
  for (const [keyword, tone] of Object.entries(map)) {
    if (lower.includes(keyword)) return tone;
  }
  return 'neutral';
}

/** Numeric sort key for number/currency cells; NaN when not parseable. */
export function numericValue(value: string): number {
  const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

const CODE_FILES: Array<['prismaSchema' | 'apiRouteCode' | 'starterTestCode' | 'readmeMarkdown', string, string]> = [
  ['prismaSchema', 'prisma/schema.prisma', 'prisma'],
  ['apiRouteCode', 'src/app/api/main/route.ts', 'typescript'],
  ['starterTestCode', 'tests/starter.test.ts', 'typescript'],
  ['readmeMarkdown', 'README.md', 'markdown']
];

export interface ToStudioOptions {
  id: string;
  source: ResultSource;
  latencyMs: number | null;
  entity?: EntityOverride;
}

/** Adapter: every producer's HackStackOutput becomes a validated StudioResult. */
export function toStudioResult(output: HackStackOutput, opts: ToStudioOptions): StudioResult {
  const { previewApp } = output;
  const fields: EntityField[] = previewApp.columns.map((key) => {
    const override = opts.entity?.fields?.[key] ?? {};
    return {
      key,
      label: override.label ?? humanizeKey(key),
      type: override.type ?? inferFieldType(key, previewApp.sampleRows.map((r) => r[key] ?? '')),
      ...(override.toneMap ? { toneMap: override.toneMap } : {})
    };
  });

  const result: StudioResult = {
    meta: { id: opts.id, name: output.projectName, tagline: output.tagline },
    entity: { name: previewApp.primaryEntityName, fields },
    rows: previewApp.sampleRows,
    sampleData: true,
    metrics: previewApp.metrics.map((m) => ({ label: m.label, value: m.value, delta: m.trend, tone: 'neutral' as const })),
    primaryAction: {
      // Strip a literal leading "+" so the UI never shows icon + "+".
      label: (previewApp.quickActionLabel || `Add ${humanizeKey(previewApp.primaryEntityName)}`).replace(/^\+\s*/, ''),
      fields
    },
    files: [
      ...CODE_FILES.map(([k, path, language]) => ({ path, language, content: output.codebase[k] })),
      ...(output.codebase.additionalFiles ?? []).map((file) => ({
        path: file.path,
        language: file.language ?? file.path.split('.').pop() ?? 'text',
        content: file.content
      }))
    ],
    slides: output.pitchDeck.map((s) => ({
      number: s.slideNumber, title: s.title, headline: s.headline, bullets: s.bullets, notes: s.speakerNote
    })),
    script: output.demoKit.scriptSegments.map((s) => ({
      timeRange: s.timeRange, action: s.visualAction, voiceover: s.voiceover
    })),
    rubric: output.demoKit.buildNextChecklist.map((i) => ({
      priority: i.priority, task: i.task, criterion: i.judgingCriteria, impact: i.impactScore
    })),
    source: opts.source,
    latencyMs: opts.latencyMs,
    validation: {
      schemaValid: output.validation.schemaValid,
      compileCheckPassed: output.validation.compileCheckPassed,
      modelUsed: output.validation.modelUsed
    }
  };
  return StudioResultSchema.parse(result);
}
