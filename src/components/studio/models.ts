import type { AIProvider } from '@/types/hackstack';

export type ModelId = string;

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: AIProvider;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'openrouter/free', label: 'OpenRouter free router', provider: 'openrouter' },
  { id: 'openai-compatible', label: 'Custom OpenAI-compatible gateway', provider: 'openai-compatible' }
];

export const DEFAULT_MODEL_ID: ModelId = 'openrouter/free';

export const STACK_OPTIONS = [
  'Next.js + Node + Postgres',
  'Next.js + Supabase + Tailwind',
  'FastAPI + React + SQLite'
];
