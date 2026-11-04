import type { AIProvider } from '@/types/hackstack';

export type ModelId = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gpt-4o-mini' | 'openai-compatible';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: AIProvider;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'gemini' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai-compatible' },
  { id: 'openai-compatible', label: 'Custom endpoint', provider: 'openai-compatible' }
];

export const DEFAULT_MODEL_ID: ModelId = 'gemini-2.5-flash';

export const STACK_OPTIONS = [
  'Next.js + Node + Postgres',
  'Next.js + Supabase + Tailwind',
  'FastAPI + React + SQLite'
];
