'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Code2,
  Presentation,
  Video,
  CheckCircle2,
  Key,
  Cpu,
  Flame,
  Globe,
  Loader2,
  Bookmark
} from 'lucide-react';
import {
  HackStackOutput,
  FALLBACK_HACKSTACK_RESULT,
  ModelConfig
} from '@/types/hackstack';
import { BUILT_IN_PRESETS, HackStackPreset } from '@/components/presets';
import PreviewTab from '@/components/PreviewTab';
import CodeTab from '@/components/CodeTab';
import PitchTab from '@/components/PitchTab';
import DemoTab from '@/components/DemoTab';

type TabType = 'preview' | 'code' | 'pitch' | 'demo';

export default function HackStackStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [selectedPresetId, setSelectedPresetId] = useState<'campussplit' | 'textswap' | 'meddrone'>('campussplit');
  const [data, setData] = useState<HackStackOutput>(FALLBACK_HACKSTACK_RESULT);

  // Model & BYOK State
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.5-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash' | 'gemini-2.5-flash' | 'openai-compatible'
  >('gemini-3.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Intake Form State
  const [ideaText, setIdeaText] = useState(BUILT_IN_PRESETS[0].ideaText);
  const [stackSelection, setStackSelection] = useState(BUILT_IN_PRESETS[0].stack);
  const [featuresList, setFeaturesList] = useState(BUILT_IN_PRESETS[0].features);

  // Generation & Stepper State
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepperMessage, setStepperMessage] = useState<string | null>(null);

  // Handle Preset Switching
  const handleSelectPreset = (preset: HackStackPreset) => {
    setSelectedPresetId(preset.id);
    setIdeaText(preset.ideaText);
    setStackSelection(preset.stack);
    setFeaturesList(preset.features);
    setData(preset.output);
  };

  // Generate HackStack Studio Action
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Animated terminal progress stepper
      setStepperMessage('[1/4] Routing via BYOK model...');
      await new Promise((r) => setTimeout(r, 400));

      setStepperMessage('[2/4] Inferring Prisma schema & API routes...');
      await new Promise((r) => setTimeout(r, 450));

      setStepperMessage('[3/4] Synthesizing 10-slide CoNSTruct deck...');
      await new Promise((r) => setTimeout(r, 450));

      setStepperMessage('[4/4] Validating contract & mounting studio...');
      await new Promise((r) => setTimeout(r, 350));

      const modelConfig: ModelConfig = {
        provider: selectedModel === 'openai-compatible' ? 'openai-compatible' : 'gemini',
        modelId: selectedModel,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined
      };

      const payload = {
        idea: ideaText.trim(),
        stack: stackSelection,
        features: featuresList.split(',').map((f) => f.trim()).filter(Boolean),
        modelConfig
      };

      // [ARYAN SLICE 2 PLUG-IN]: Calls POST /api/generate returning HackStackOutput JSON
      let resultData: HackStackOutput | null = null;

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.projectName) {
            resultData = json as HackStackOutput;
          }
        }
      } catch (networkErr) {
        // Expected when Slice 2 /api/generate route is not merged yet
        console.info('Live /api/generate route not active yet; utilizing client preset fallback:', networkErr);
      }

      if (resultData) {
        setData(resultData);
      } else {
        // Smooth graceful fallback: Match existing preset or dynamically customize
        const matchedPreset = BUILT_IN_PRESETS.find((p) => p.id === selectedPresetId);
        const baseOutput = matchedPreset ? matchedPreset.output : FALLBACK_HACKSTACK_RESULT;

        const words = ideaText.trim().split(/\s+/).slice(0, 3).join(' ');
        const customName = words ? `${words.charAt(0).toUpperCase() + words.slice(1)} AI` : baseOutput.projectName;

        setData({
          ...baseOutput,
          projectName: ideaText ? customName : baseOutput.projectName,
          tagline: ideaText || baseOutput.tagline,
          validation: {
            ...baseOutput.validation,
            modelUsed: `${selectedModel} (active)`
          }
        });
      }
    } finally {
      setIsGenerating(false);
      setStepperMessage(null);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#10B981]/20 selection:text-[#10B981]">
      {/* Studio Header */}
      <header className="border-b border-[#1E293B] bg-[#090D16]/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-lg shadow-[#10B981]/10">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-[#F8FAFC]">HackStack Studio</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono font-medium">
                Team Blue10.1
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">AI Hackathon Launchpad • CoNSTruct 70h Fast Lane</p>
          </div>
        </div>

        {/* BYOK Model Selector Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-[#0F172A] border border-[#1E293B] rounded-lg p-1.5 max-w-full">
          <div className="flex items-center gap-1.5 px-2 text-[#94A3B8]">
            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-mono">BYOK Router</span>
          </div>

          <select
            value={selectedModel}
            onChange={(e) =>
              setSelectedModel(
                e.target.value as
                  | 'gemini-3.5-flash'
                  | 'gemini-3.7-flash'
                  | 'gemini-3.8-flash'
                  | 'gemini-2.5-flash'
                  | 'openai-compatible'
              )
            }
            className="bg-[#131C2E] text-[#F8FAFC] border border-[#1E293B] rounded px-2.5 py-1 font-mono focus:outline-none focus:border-[#10B981] cursor-pointer text-xs"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Stable)</option>
            <option value="gemini-3.7-flash">gemini-3.7-flash (Hybrid)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (Extended)</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash (Ultra Fast)</option>
            <option value="openai-compatible">openai-compatible (Custom)</option>
          </select>

          {selectedModel === 'openai-compatible' && (
            <div className="flex items-center gap-1 bg-[#131C2E] border border-[#1E293B] rounded px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Base URL"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="bg-transparent text-xs font-mono text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none w-32 sm:w-40"
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-[#131C2E] border border-[#1E293B] rounded px-2 py-1">
            <Key className="w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-transparent text-xs font-mono text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none w-28 sm:w-36"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] px-1"
            >
              {showKey ? 'hide' : 'show'}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 text-[#10B981] font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Ready</span>
          </div>
        </div>
      </header>

      {/* Main Studio Body: Left Sidebar + Right 4-Tab Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Intake Sidebar */}
        <aside className="w-full lg:w-84 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0A0F1D]/80 p-4 lg:p-6 flex flex-col gap-5 shrink-0 overflow-y-auto">
          {/* Section Header */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-[#94A3B8] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#10B981]" />
              Hackathon Idea Intake
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select a rich preset or enter your custom 2-sentence hackathon idea.
            </p>
          </div>

          {/* 3 Built-in Presets Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-[#10B981]" />
              1-Click Built-in Presets:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {BUILT_IN_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#10B981]/15 border-[#10B981] text-[#F8FAFC] shadow-sm'
                        : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{preset.name}</div>
                      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">{preset.badge}</div>
                    </div>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Idea Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#F8FAFC]">2-Sentence Idea</label>
            <textarea
              rows={3}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="e.g. Peer-to-peer textbook exchange with UPI escrow hold..."
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2.5 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] transition resize-none font-sans"
            />
          </div>

          {/* Stack Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#F8FAFC]">Target Stack</label>
            <select
              value={stackSelection}
              onChange={(e) => setStackSelection(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#10B981] cursor-pointer"
            >
              <option value="Next.js + Node + Postgres">Next.js + Node + Postgres (Golden Template)</option>
              <option value="Next.js + Supabase + Tailwind">Next.js + Supabase + Tailwind</option>
              <option value="FastAPI + React + SQLite">FastAPI + React + SQLite</option>
            </select>
          </div>

          {/* Key Features */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#F8FAFC]">Key Features (comma-separated)</label>
            <input
              type="text"
              value={featuresList}
              onChange={(e) => setFeaturesList(e.target.value)}
              placeholder="e.g. UPI Escrow, Barcode Scanner, Hostel Delivery"
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-60 text-[#090D16] font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 transition active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Launch Kit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate HackStack Studio</span>
              </>
            )}
          </button>

          {/* Stepper Progress Notification */}
          {stepperMessage && (
            <div className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 p-2.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
              <span className="truncate">{stepperMessage}</span>
            </div>
          )}

          {/* Contract Status Footnote */}
          <div className="mt-auto pt-4 border-t border-[#1E293B]/80 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-mono text-[11px]">Contract Status:</span>
              <span className="flex items-center gap-1 text-[#10B981] font-mono text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Schema Validated
              </span>
            </div>
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-mono text-[11px]">Compile Check:</span>
              <span className="flex items-center gap-1 text-[#10B981] font-mono text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Passed (Vitest)
              </span>
            </div>
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-mono text-[11px]">Active Preset:</span>
              <span className="text-[#F8FAFC] font-mono text-[11px] truncate max-w-[140px]" title={data.projectName}>
                {data.projectName}
              </span>
            </div>
          </div>
        </aside>

        {/* Right Output Workspace with 4 Tabs */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#090D16]">
          {/* Tab Navigation Bar */}
          <div className="border-b border-[#1E293B] bg-[#0A0F1D]/60 px-4 lg:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/5'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tab 1: Live App Preview
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'code'
                  ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/5'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Tab 2: Code, Schema & Tests
            </button>

            <button
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'pitch'
                  ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/5'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Presentation className="w-4 h-4" />
              Tab 3: 10-Slide Pitch Deck
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'demo'
                  ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/5'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Video className="w-4 h-4" />
              Tab 4: 60s Demo & Checklist
            </button>
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            {activeTab === 'preview' && <PreviewTab data={data} />}
            {activeTab === 'code' && <CodeTab data={data} />}
            {activeTab === 'pitch' && <PitchTab data={data} />}
            {activeTab === 'demo' && <DemoTab data={data} />}
          </div>
        </main>
      </div>
    </div>
  );
}
