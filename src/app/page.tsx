'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bookmark,
  Check,
  Code2,
  Copy,
  Globe,
  Info,
  Key,
  Layers,
  Loader2,
  Monitor,
  Presentation,
  Sparkles,
  Video
} from 'lucide-react';
import {
  AIProvider,
  FALLBACK_HACKSTACK_RESULT,
  HackStackOutput,
  ModelConfig
} from '@/types/hackstack';
import { BUILT_IN_PRESETS, HackStackPreset } from '@/components/presets';
import { synthesizeCustomHackStack } from '@/components/offline-synth';
import NodeGraph from '@/components/NodeGraph';
import type { StudioTab } from '@/components/NodeGraph';
import PreviewTab from '@/components/PreviewTab';
import { toStudioResult } from '@/lib/studio-result';
import CodeTab from '@/components/CodeTab';
import PitchTab from '@/components/PitchTab';
import DemoTab from '@/components/DemoTab';

type ModelId = 'gemini-3.1-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.8-flash' | 'gpt-4o-mini' | 'openai-compatible';

interface ModelOption {
  id: ModelId;
  label: string;
  provider: AIProvider;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', provider: 'gemini' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'gemini' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', provider: 'gemini' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai-compatible' },
  { id: 'openai-compatible', label: 'Custom endpoint', provider: 'openai-compatible' }
];

const STACK_OPTIONS = [
  'Next.js + Node + Postgres',
  'Next.js + Supabase + Tailwind',
  'FastAPI + React + SQLite'
];

const TABS: { id: StudioTab; label: string; icon: LucideIcon }[] = [
  { id: 'preview', label: 'Live preview', icon: Monitor },
  { id: 'code', label: 'Code & tests', icon: Code2 },
  { id: 'pitch', label: 'Pitch deck', icon: Presentation },
  { id: 'demo', label: '60s demo', icon: Video }
];

type NoticeTone = 'info' | 'warning' | 'error';
type Notice = { tone: NoticeTone; text: string } | null;
type ResultSource = 'preset' | 'live' | 'offline';

const NOTICE_ICON: Record<NoticeTone, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle
};

const NOTICE_TONE: Record<NoticeTone, string> = {
  info: 'border-[#1E293B] bg-[#0F172A] text-[#CBD5E1]',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-100'
};

const FIELD =
  'w-full rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#10B981] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#10B981]';

function isHackStackOutput(value: unknown): value is HackStackOutput {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<HackStackOutput>;
  return (
    typeof candidate.projectName === 'string' &&
    candidate.previewApp !== undefined &&
    candidate.codebase !== undefined &&
    Array.isArray(candidate.pitchDeck) &&
    candidate.demoKit !== undefined
  );
}

function RailSection({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] text-[#10B981]">{index}</span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function HackStackStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('preview');
  const [data, setData] = useState<HackStackOutput>(FALLBACK_HACKSTACK_RESULT);
  const [resultSource, setResultSource] = useState<ResultSource>('preset');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-3.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [ideaText, setIdeaText] = useState(BUILT_IN_PRESETS[0].ideaText);
  const [stackSelection, setStackSelection] = useState(BUILT_IN_PRESETS[0].stack);
  const [featuresList, setFeaturesList] = useState(BUILT_IN_PRESETS[0].features);

  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const activePreset = BUILT_IN_PRESETS.find((preset) => preset.ideaText === ideaText.trim()) ?? null;
  const selectedModelOption = MODEL_OPTIONS.find((option) => option.id === selectedModel) ?? MODEL_OPTIONS[1];

  const applyPreset = useCallback((preset: HackStackPreset) => {
    setIdeaText(preset.ideaText);
    setStackSelection(preset.stack);
    setFeaturesList(preset.features);
    setData(preset.output);
    setResultSource('preset');
    setLatencyMs(null);
    setNotice(null);
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('preset');
    const preset = BUILT_IN_PRESETS.find((candidate) => candidate.id === requested);
    if (preset) applyPreset(preset);
  }, [applyPreset]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activePreset) url.searchParams.set('preset', activePreset.id);
    else url.searchParams.delete('preset');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }, [activePreset]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    const idea = ideaText.trim();
    if (!idea) {
      setNotice({ tone: 'error', text: 'Describe your idea before generating.' });
      return;
    }

    const features = featuresList.split(',').map((feature) => feature.trim()).filter(Boolean);
    const modelConfig: ModelConfig = {
      provider: selectedModelOption.provider,
      modelId: selectedModelOption.id,
      apiKey: apiKey.trim(),
      baseUrl: selectedModel === 'openai-compatible' && baseUrl.trim() ? baseUrl.trim() : undefined
    };

    const startedAt = performance.now();
    setIsGenerating(true);
    setNotice(null);

    try {
      // [ARYAN SLICE 2 PLUG-IN]: Calls POST /api/generate returning HackStackOutput JSON
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, stack: stackSelection, features, modelConfig })
      });
      if (!response.ok) {
        throw new Error(`the generation service returned status ${response.status}`);
      }
      const json: unknown = await response.json();
      if (!isHackStackOutput(json)) {
        throw new Error('the generation service returned an unexpected format');
      }
      setData(json);
      setResultSource('live');
      setNotice({ tone: 'info', text: `Generated with ${selectedModelOption.label}.` });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'of an unknown error';
      const matchedPreset = BUILT_IN_PRESETS.find((preset) => preset.ideaText === idea);
      setData(
        matchedPreset
          ? matchedPreset.output
          : synthesizeCustomHackStack({ idea, stack: stackSelection, features })
      );
      setResultSource('offline');
      setNotice({
        tone: 'warning',
        text: `Live generation failed because ${reason}. Showing an offline build of your idea.`
      });
    } finally {
      setLatencyMs(Math.round(performance.now() - startedAt));
      setIsGenerating(false);
    }
  }, [apiKey, baseUrl, featuresList, ideaText, isGenerating, selectedModel, selectedModelOption, stackSelection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setNotice({ tone: 'error', text: 'Could not copy the link. Copy it from the address bar instead.' });
    }
  }, []);

  const latencyLabel = latencyMs === null ? 'No run yet' : `${(latencyMs / 1000).toFixed(1)}s`;
  const sourceLabel = resultSource === 'live' ? 'Live model' : resultSource === 'offline' ? 'Offline build' : 'Preset';
  const studioResult = useMemo(
    () =>
      toStudioResult(data, {
        id: activePreset?.id ?? 'custom',
        source: resultSource === 'live' ? 'live' : resultSource === 'offline' ? 'offline' : 'cached',
        latencyMs,
        entity: activePreset?.entity
      }),
    [data, activePreset, resultSource, latencyMs]
  );
  const NoticeIcon = notice ? NOTICE_ICON[notice.tone] : null;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#090D16] font-sans text-[#F8FAFC] selection:bg-[#10B981]/20 selection:text-[#10B981]">
      <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#090D16]/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#1E293B] bg-[#0F172A] text-[#10B981]">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[#F8FAFC]">HackStack Studio</div>
              <div className="font-mono text-[11px] text-[#64748B]">Team Blue10.1 · NST-ADYPU</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-2 py-1">
              <label htmlFor="model-select" className="px-1 font-mono text-[11px] text-[#94A3B8]">Model</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value as ModelId)}
                className="cursor-pointer rounded bg-[#131C2E] px-2 py-1 font-mono text-xs text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedModel === 'openai-compatible' && (
              <div className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-2 py-1">
                <Globe className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Base URL for custom endpoint"
                  placeholder="https://your-endpoint/v1"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  className="w-36 bg-transparent font-mono text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none sm:w-48"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-2 py-1">
              <Key className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <input
                type={showKey ? 'text' : 'password'}
                aria-label="API key"
                placeholder="API key (optional)"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="w-28 bg-transparent font-mono text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none sm:w-36"
              />
              <button
                type="button"
                onClick={() => setShowKey((previous) => !previous)}
                className="px-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-[#1E293B] bg-[#0F172A] px-2.5 py-1.5 font-mono text-[11px] text-[#94A3B8]">
              <span>{latencyLabel}</span>
              <span className="text-[#334155]">/</span>
              <span className={resultSource === 'live' ? 'text-[#10B981]' : 'text-[#CBD5E1]'}>{sourceLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-2.5 py-1.5 text-xs text-[#CBD5E1] transition-colors hover:border-[#10B981]/50 hover:text-[#F8FAFC]"
            >
              {linkCopied ? <Check className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {linkCopied ? 'Link copied' : 'Share studio link'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-7 border-b border-[#1E293B] bg-[#0A0F1D] p-4 lg:w-[22rem] lg:border-b-0 lg:border-r lg:p-6">
          <RailSection index="01" title="Start from a preset">
            <div className="flex flex-col gap-2">
              {BUILT_IN_PRESETS.map((preset) => {
                const isActive = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => applyPreset(preset)}
                    className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'border-[#10B981]/60 bg-[#10B981]/10'
                        : 'border-[#1E293B] bg-[#0F172A] hover:border-[#334155]'
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-[#F8FAFC]">{preset.name}</span>
                      <span className="font-mono text-[11px] text-[#94A3B8]">{preset.badge}</span>
                    </span>
                    {isActive && <Bookmark className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </RailSection>

          <RailSection index="02" title="Describe the idea">
            <div className="flex flex-col gap-3">
              <label htmlFor="idea-input" className="sr-only">Two-sentence idea</label>
              <textarea
                id="idea-input"
                rows={4}
                value={ideaText}
                onChange={(event) => setIdeaText(event.target.value)}
                placeholder="Two sentences: who has the problem, and what your app does about it."
                className={`${FIELD} resize-none leading-relaxed`}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="stack-select" className="text-xs text-[#94A3B8]">Stack</label>
                <select
                  id="stack-select"
                  value={stackSelection}
                  onChange={(event) => setStackSelection(event.target.value)}
                  className={`${FIELD} cursor-pointer font-mono text-xs`}
                >
                  {STACK_OPTIONS.map((stack) => (
                    <option key={stack} value={stack}>
                      {stack}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="features-input" className="text-xs text-[#94A3B8]">Must-have features (comma-separated)</label>
                <input
                  id="features-input"
                  type="text"
                  value={featuresList}
                  onChange={(event) => setFeaturesList(event.target.value)}
                  placeholder="Escrow hold, barcode scan, pickup point"
                  className={FIELD}
                />
              </div>
            </div>
          </RailSection>

          <RailSection index="03" title="Generate">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                className="flex items-center justify-between gap-2 rounded-md bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-[#090D16] transition-colors hover:bg-[#34D399] disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {isGenerating ? 'Generating...' : 'Generate studio'}
                </span>
                <kbd className="rounded border border-[#090D16]/30 px-1.5 py-0.5 font-mono text-[10px] font-normal">Ctrl Enter</kbd>
              </button>

              {isGenerating && (
                <p role="status" className="font-mono text-xs text-[#10B981]">
                  Waiting for the model. Live runs average about 20 seconds.
                </p>
              )}

              {notice && NoticeIcon && (
                <div role="alert" className={`flex items-start gap-2.5 rounded-md border p-3 text-xs leading-relaxed ${NOTICE_TONE[notice.tone]}`}>
                  <NoticeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{notice.text}</span>
                </div>
              )}
            </div>
          </RailSection>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:p-8">
          <NodeGraph data={data} activeTab={activeTab} modelLabel={selectedModelOption.label} onSelect={setActiveTab} />

          <div className="flex flex-col">
            <div role="tablist" aria-label="Studio outputs" className="flex gap-1 overflow-x-auto border-b border-[#1E293B]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm transition-colors ${
                      isActive
                        ? 'border-[#10B981] text-[#F8FAFC]'
                        : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" className="pt-6">
              {activeTab === 'preview' && <PreviewTab result={studioResult} />}
              {activeTab === 'code' && <CodeTab data={data} />}
              {activeTab === 'pitch' && <PitchTab data={data} />}
              {activeTab === 'demo' && <DemoTab data={data} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
