import { z } from 'zod';

export const agentIdSchema = z.enum(['product', 'architecture', 'ui', 'code', 'pitch', 'qa']);
export type AgentId = z.infer<typeof agentIdSchema>;

export const AGENTS: Record<AgentId, { label: string; purpose: string; dependsOn: AgentId[] }> = {
  product: { label: 'Product strategist', purpose: 'Turn the idea into a focused problem, users, and requirements.', dependsOn: [] },
  architecture: { label: 'System architect', purpose: 'Design the data model, API boundaries, and technical tradeoffs.', dependsOn: ['product'] },
  ui: { label: 'UX designer', purpose: 'Define the primary user flow and interface states.', dependsOn: ['product'] },
  code: { label: 'Implementation engineer', purpose: 'Turn the approved product and architecture into starter code.', dependsOn: ['architecture', 'ui'] },
  pitch: { label: 'Pitch coach', purpose: 'Create a truthful demo narrative and judging-focused pitch.', dependsOn: ['product', 'architecture'] },
  qa: { label: 'QA reviewer', purpose: 'Check consistency, security, feasibility, and missing requirements.', dependsOn: ['product', 'architecture', 'ui', 'code', 'pitch'] }
};

export const agentRunRequestSchema = z.object({
  agent: agentIdSchema,
  idea: z.string().trim().min(1).max(2000),
  context: z.string().max(30_000).default(''),
  provider: z.enum(['openrouter', 'gemini', 'openai-compatible']).default('openrouter'),
  model: z.string().trim().min(1).max(160).default('openrouter/free'),
  apiKey: z.string().max(500).default(''),
  baseUrl: z.string().trim().url().optional()
});

const agentPatchSchema = z.object({
  livePreview: z.object({
    appName: z.string().optional(),
    tagline: z.string().optional(),
    primaryAction: z.string().optional(),
    kpis: z.array(z.record(z.string(), z.unknown())).optional(),
    tableTitle: z.string().optional(),
    columns: z.array(z.unknown()).optional(),
    sampleRows: z.array(z.record(z.string(), z.unknown())).optional()
  }).optional(),
  files: z.union([
    z.record(z.string(), z.string()),
    z.array(z.object({ path: z.string(), content: z.string(), language: z.string().optional() }))
  ]).optional(),
  pitchSlides: z.array(z.record(z.string(), z.unknown())).optional(),
  demoScript: z.array(z.record(z.string(), z.unknown())).optional(),
  judgeChecklist: z.array(z.record(z.string(), z.unknown())).optional(),
  validation: z.object({
    schemaValid: z.boolean().optional(),
    compileCheckPassed: z.boolean().optional(),
    summary: z.string().optional()
  }).optional()
}).passthrough();

export type AgentPatch = z.infer<typeof agentPatchSchema>;

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('Agent response did not contain a JSON patch');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}' && --depth === 0) return text.slice(start, index + 1);
  }
  throw new Error('Agent response contained an incomplete JSON patch');
}

function normalizeTimeRange(value: unknown, index: number): string {
  const expected = ['0:00 - 0:15', '0:15 - 0:30', '0:30 - 0:45', '0:45 - 1:00'];
  const text = String(value ?? '').trim();
  const timestamps = text.match(/^(\d+):([0-5]\d)\s*[-–]\s*(\d+):([0-5]\d)$/);
  if (timestamps) return `${Number(timestamps[1])}:${timestamps[2]} - ${Number(timestamps[3])}:${timestamps[4]}`;
  const match = text.match(/^(\d+)\s*[-–]\s*(\d+)\s*s?$/i);
  if (!match) return expected[index] ?? expected[expected.length - 1];
  const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return `${format(Number(match[1]))} - ${format(Number(match[2]))}`;
}

function normalizeRowKeys(rows: Array<Record<string, unknown>>, columns: string[]): Record<string, string>[] {
  return rows.map((row) => Object.fromEntries(columns.map((column) => {
    const normalizedColumn = column.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const source = Object.keys(row).find((key) => key === column || key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normalizedColumn);
    return [column, String(source ? row[source] ?? '' : '')];
  })));
}

export function parseAgentPatch(text: string): AgentPatch {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(cleaned));
  } catch {
    parsed = JSON.parse(extractJsonObject(cleaned).replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'));
  }
  const raw = agentPatchSchema.parse(parsed);
  const patch = { ...raw };
  if (patch.livePreview) {
    const columns = patch.livePreview.columns?.map((column, index) => {
      if (typeof column === 'string') return column.replace(/[^a-zA-Z0-9]+(.)?/g, (_, next: string | undefined) => next ? next.toUpperCase() : '').replace(/^[A-Z]/, (letter) => letter.toLowerCase()) || `field${index + 1}`;
      if (column && typeof column === 'object' && 'key' in column) return String(column.key);
      return `field${index + 1}`;
    });
    patch.livePreview = {
      ...patch.livePreview,
      columns,
      sampleRows: patch.livePreview.sampleRows && columns ? normalizeRowKeys(patch.livePreview.sampleRows, columns) : patch.livePreview.sampleRows
    };
  }
  if (patch.pitchSlides) patch.pitchSlides = patch.pitchSlides.slice(0, 10).map((slide, index) => ({ ...slide, slideNumber: index + 1 }));
  if (patch.demoScript) patch.demoScript = patch.demoScript.slice(0, 4).map((segment, index) => ({ ...segment, timeRange: normalizeTimeRange(segment.timeRange, index) }));
  return patch;
}

export function mergeAgentPatch(output: import('@/types/hackstack').HackStackOutput, patch: AgentPatch) {
  const next = structuredClone(output);
  const preview = patch.livePreview;
  if (preview) {
    if (preview.appName) next.projectName = preview.appName;
    if (preview.tagline) next.tagline = preview.tagline;
    if (preview.primaryAction) next.previewApp.quickActionLabel = preview.primaryAction;
    if (preview.tableTitle) next.previewApp.primaryEntityName = preview.tableTitle;
    if (preview.columns?.length) next.previewApp.columns = preview.columns as string[];
    if (preview.sampleRows?.length) next.previewApp.sampleRows = normalizeRowKeys(preview.sampleRows, next.previewApp.columns);
    if (preview.kpis?.length) next.previewApp.metrics = preview.kpis.slice(0, 3).map((kpi, index) => ({
      label: String(kpi.label ?? `KPI ${index + 1}`),
      value: String(kpi.value ?? ''),
      trend: String(kpi.trend ?? kpi.delta ?? '')
    }));
  }
  if (patch.files) {
    const files = Array.isArray(patch.files) ? patch.files : Object.entries(patch.files).map(([path, content]) => ({ path, content }));
    const additional = [...(next.codebase.additionalFiles ?? [])];
    for (const file of files) {
      if (file.path.endsWith('schema.prisma')) next.codebase.prismaSchema = file.content;
      else if (file.path.endsWith('route.ts')) next.codebase.apiRouteCode = file.content;
      else if (file.path.endsWith('starter.test.ts')) next.codebase.starterTestCode = file.content;
      else if (file.path === 'README.md') next.codebase.readmeMarkdown = file.content;
      else {
        const index = additional.findIndex((candidate) => candidate.path === file.path);
        if (index >= 0) additional[index] = { ...additional[index], ...file };
        else additional.push(file);
      }
    }
    next.codebase.additionalFiles = additional;
  }
  if (patch.pitchSlides?.length === 10) next.pitchDeck = patch.pitchSlides.map((slide, index) => ({
    slideNumber: index + 1,
    title: String(slide.title ?? `Slide ${index + 1}`),
    headline: String(slide.headline ?? ''),
    bullets: Array.isArray(slide.bullets) ? slide.bullets.map(String) : [],
    speakerNote: String(slide.speakerNote ?? slide.notes ?? '')
  }));
  if (patch.demoScript?.length === 4) next.demoKit.scriptSegments = patch.demoScript.map((segment, index) => ({
    timeRange: normalizeTimeRange(segment.timeRange, index),
    visualAction: String(segment.visualAction ?? segment.action ?? ''),
    voiceover: String(segment.voiceover ?? '')
  }));
  if (patch.judgeChecklist?.length) next.demoKit.buildNextChecklist = patch.judgeChecklist.map((item, index) => ({
    priority: Number(item.priority ?? index + 1),
    task: String(item.task ?? ''),
    judgingCriteria: String(item.judgingCriteria ?? item.criterion ?? 'Feasibility') as import('@/types/hackstack').JudgingCriterion,
    impactScore: String(item.impactScore ?? item.impact ?? '')
  }));
  if (patch.validation) next.validation = {
    ...next.validation,
    schemaValid: patch.validation.schemaValid ?? next.validation.schemaValid,
    compileCheckPassed: patch.validation.compileCheckPassed ?? next.validation.compileCheckPassed
  };
  return next;
}

export function buildAgentPrompt(agent: AgentId, idea: string, context: string): string {
  const definition = AGENTS[agent];
  return `You are the ${definition.label} in HackStack. Your responsibility: ${definition.purpose}

Project idea:
${idea}

Previous agent context:
${context || 'None yet.'}

Return a JSON object only, wrapped in no prose. Use only the patch keys relevant to your role:
- product/ui: livePreview with appName, tagline, primaryAction, kpis, tableTitle, columns, sampleRows
- architecture/code: files as a path-to-content object; include schema.prisma, route.ts, and page.tsx when relevant
- pitch: pitchSlides with exactly 10 slides and demoScript with exactly 4 segments
- qa: judgeChecklist and validation
Do not invent user research or metrics.`;
}
