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

export function buildAgentPrompt(agent: AgentId, idea: string, context: string): string {
  const definition = AGENTS[agent];
  return `You are the ${definition.label} in HackStack. Your responsibility: ${definition.purpose}

Project idea:
${idea}

Previous agent context:
${context || 'None yet.'}

Return a concise, structured artifact for the next agent. Separate facts, assumptions, decisions, risks, and next actions. Do not invent user research or metrics.`;
}
