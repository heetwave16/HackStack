import { z } from 'zod';

export const agentIdSchema = z.enum(['product', 'architecture', 'ui', 'code', 'pitch', 'qa']);
export type AgentId = z.infer<typeof agentIdSchema>;

export const AGENTS: Record<AgentId, { label: string; purpose: string; dependsOn: AgentId[] }> = {
  product: { label: 'Domain product strategist', purpose: 'Extract the exact users, trigger action, domain outcome, and success criteria from the idea.', dependsOn: [] },
  architecture: { label: 'Domain system architect', purpose: 'Design idea-specific entities, state transitions, calculations, validation rules, and stack-appropriate API boundaries.', dependsOn: ['product'] },
  ui: { label: 'Domain UX designer', purpose: 'Define controls for the core interactive loop and states for validation, progress, and the resulting domain artifact.', dependsOn: ['product'] },
  code: { label: 'Domain implementation engineer', purpose: 'Turn the approved product and architecture into runnable route.ts and page.tsx logic with real calculations and no placeholders.', dependsOn: ['architecture', 'ui'] },
  pitch: { label: 'Domain pitch coach', purpose: 'Create a truthful demo narrative that proves the core interactive loop and its user value.', dependsOn: ['product', 'architecture'] },
  qa: { label: 'Domain QA reviewer', purpose: 'Check that the generated flow, data model, route, page, validation, calculations, and pitch all match the idea without boilerplate.', dependsOn: ['product', 'architecture', 'ui', 'code', 'pitch'] }
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
  return `You are the ${definition.label} in HackStack, acting as a Domain-Specific Full-Stack Architect team member.
Your responsibility: ${definition.purpose}

Project idea:
${idea}

Previous agent context:
${context || 'None yet.'}

First identify the core interactive loop: user input/action -> domain calculation or state transition -> output artifact.
Keep every entity, field, status, rule, control, and example specific to this idea and the selected stack.
Return a concise, structured artifact for the next agent. Separate facts, assumptions, decisions, risks, and next actions.
Do not invent user research or metrics. Never return boilerplate placeholders, generic CRUD language, TODO comments, or unimplemented code.
If you provide route.ts or page.tsx code, it must be runnable, validate inputs, implement the domain state transition/calculation, and render the resulting artifact.`;
}
