import type { AIProvider } from '@/types/hackstack';

export type ModelId = 'gemini-3.1-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.8-flash' | 'gpt-4o-mini' | 'openai-compatible';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: AIProvider;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', provider: 'gemini' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'gemini' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', provider: 'gemini' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai-compatible' },
  { id: 'openai-compatible', label: 'Custom endpoint', provider: 'openai-compatible' }
];

export const DEFAULT_MODEL_ID: ModelId = 'gemini-3.5-flash';

export const STACK_OPTIONS = [
  'Next.js + Node + Postgres',
  'Next.js + Supabase + Tailwind',
  'FastAPI + React + SQLite'
];
