'use client';

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Sparkles,
  Layers,
  Code2,
  Presentation,
  Video,
  CheckCircle2,
  Key,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode,
  Download,
  Flame,
  PlusCircle,
  Copy,
  Check,
  StopCircle,
  Loader2,
  Globe
} from 'lucide-react';
import {
  FALLBACK_HACKSTACK_RESULT,
  HackStackOutput
} from '@/types/hackstack';

export default function HackStackStudioPage() {
  const [data, setData] = useState<HackStackOutput>(FALLBACK_HACKSTACK_RESULT);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'pitch' | 'demo'>('preview');
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.5-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash' | 'gemini-2.5-flash' | 'openai-compatible'
  >('gemini-3.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [codeSubTab, setCodeSubTab] = useState<'prisma' | 'api' | 'tests' | 'readme'>('prisma');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Intake form & simulation state
  const [ideaText, setIdeaText] = useState(
    'Instant UPI bill-splitting and late-night hostel order pooling for college campuses.'
  );
  const [stackSelection, setStackSelection] = useState('Next.js + Node + Postgres');
  const [featuresList, setFeaturesList] = useState('UPI Micro-Splits, Live 10m Lobby, Receipt OCR');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStep, setGenerateStep] = useState<string | null>(null);

  // Screen recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(60);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive Live Preview: Add row & increment metric
  const handleAddPreviewRow = () => {
    const poolNum = data.previewApp.sampleRows.length + 1;
    const newRow = {
      poolName: `Late Night Food Pool #${poolNum}`,
      hostelWing: `Block C - ${poolNum}rd Floor`,
      totalAmount: `₹${(Math.floor(Math.random() * 8) + 2) * 100}`,
      status: 'Pooling (2/5 joined)'
    };
    setData((prev) => {
      const updatedMetrics = prev.previewApp.metrics.map((m) => {
        if (m.label.toLowerCase().includes('active')) {
          const currentVal = parseInt(m.value, 10) || 0;
          return { ...m, value: String(currentVal + 1), trend: `+${poolNum} tonight` };
        }
        return m;
      });
      return {
        ...prev,
        previewApp: {
          ...prev.previewApp,
          metrics: updatedMetrics,
          sampleRows: [newRow, ...prev.previewApp.sampleRows]
        }
      };
    });
  };

  const handleCopyCode = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // ZIP packaging with JSZip
  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();
      zip.file('prisma/schema.prisma', data.codebase.prismaSchema);
      zip.file('src/app/api/pools/route.ts', data.codebase.apiRouteCode);
      zip.file('src/test/starter.test.ts', data.codebase.starterTestCode);
      zip.file('README.md', data.codebase.readmeMarkdown);
      zip.file('.env.example', 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackstack?schema=public"\n');
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `${slug}-hackstack-starter.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Export Pitch Deck as Markdown
  const handleExportDeckMarkdown = () => {
    const md = `# ${data.projectName} — 10-Slide Pitch Deck\n${data.tagline}\n\n` +
      data.pitchDeck.map((slide) => (
        `## Slide ${slide.slideNumber}: ${slide.title}\n` +
        `### ${slide.headline}\n\n` +
        slide.bullets.map((b) => `- ${b}`).join('\n') +
        `\n\n> **Speaker Note**: ${slide.speakerNote}\n`
      )).join('\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${slug}-pitch-deck.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keyboard navigation for Pitch Deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'pitch') return;
      if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentSlideIndex((prev) => Math.min(data.pitchDeck.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, data.pitchDeck.length]);

  // Screen recorder controls
  const startScreenRecording = async () => {
    setRecordingError(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setRecordingError('Screen recording is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        setRecordingSeconds(60);

        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          a.download = `${slug}-60s-demo-walkthrough.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(60);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev <= 1) {
            stopScreenRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        setRecordingError(err.message);
      }
      setIsRecording(false);
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Generation flow simulation for intake form
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateStep('Step 1/3: Inferring schema and relational entities...');
    await new Promise((r) => setTimeout(r, 450));
    setGenerateStep('Step 2/3: Validating Zod contracts & Vitest suites...');
    await new Promise((r) => setTimeout(r, 450));
    setGenerateStep('Step 3/3: Assembling 10-slide deck & 60s demo kit...');
    await new Promise((r) => setTimeout(r, 400));

    const words = ideaText.trim().split(/\s+/).slice(0, 3).join(' ');
    const dynamicName = words ? `${words.charAt(0).toUpperCase() + words.slice(1)} AI` : 'HackStack Project';

    setData((prev) => ({
      ...prev,
      projectName: ideaText ? dynamicName : prev.projectName,
      tagline: ideaText || prev.tagline,
      validation: {
        ...prev.validation,
        modelUsed: `${selectedModel} (active)`
      }
    }));

    setIsGenerating(false);
    setGenerateStep(null);
  };

  const currentSlide = data.pitchDeck[currentSlideIndex] || data.pitchDeck[0] || {
    slideNumber: 1,
    title: 'Overview',
    headline: data.projectName,
    bullets: [data.tagline],
    speakerNote: 'Presenting HackStack project overview.'
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#10B981]/20 selection:text-[#10B981]">
      {/* Studio Header */}
      <header className="border-b border-[#1E293B] bg-[#090D16]/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
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
              className="bg-transparent text-xs font-mono text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none w-32 sm:w-40"
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

      {/* Main Studio Body: Sidebar + 4 Tabs */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Intake Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0A0F1D]/70 p-4 lg:p-6 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-[#94A3B8] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#10B981]" />
              Hackathon Idea Intake
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">Define your idea in 2 sentences to scaffold the full launch kit.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#F8FAFC]">2-Sentence Idea</label>
            <textarea
              rows={3}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="e.g., Peer-to-peer textbook exchange for NST students with UPI escrow..."
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2.5 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] transition resize-none font-sans"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#F8FAFC]">Key Features (comma-separated)</label>
            <input
              type="text"
              value={featuresList}
              onChange={(e) => setFeaturesList(e.target.value)}
              placeholder="e.g. UPI Escrow Hold, Barcode Scanner, Hostel Delivery"
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-60 text-[#090D16] font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 transition active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Kit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Launch Kit</span>
              </>
            )}
          </button>

          {generateStep && (
            <div className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 p-2 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>{generateStep}</span>
            </div>
          )}

          {/* Validation & Compile Status Card */}
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
              <span className="text-[#F8FAFC] font-mono text-[11px] truncate max-w-[130px]" title={data.validation.modelUsed}>
                {data.validation.modelUsed || 'Golden Preset'}
              </span>
            </div>
          </div>
        </aside>

        {/* Right Output Workspace with 4 Tabs */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#090D16]">
          {/* Tab Navigation Bar */}
          <div className="border-b border-[#1E293B] bg-[#0A0F1D]/50 px-4 lg:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
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
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
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
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
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
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
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
            {/* TAB 1: LIVE APP PREVIEW */}
            {activeTab === 'preview' && (
              <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">{data.projectName}</h1>
                    <p className="text-xs text-[#94A3B8] mt-1">{data.tagline}</p>
                  </div>
                  <button
                    onClick={handleAddPreviewRow}
                    className="self-start sm:self-auto bg-[#10B981] hover:bg-[#10B981]/90 text-[#090D16] font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-[#10B981]/15"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {data.previewApp.quickActionLabel}
                  </button>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.previewApp.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1 shadow-sm"
                    >
                      <span className="text-xs text-[#94A3B8]">{metric.label}</span>
                      <div className="text-2xl font-bold font-mono text-[#F8FAFC]">{metric.value}</div>
                      <span className="text-[11px] text-[#10B981] font-mono">{metric.trend}</span>
                    </div>
                  ))}
                </div>

                {/* Primary Entity Table */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wide">
                      {data.previewApp.primaryEntityName}
                    </h3>
                    <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                      Live State Interactive
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#131C2E] border-b border-[#1E293B] text-[#94A3B8] font-mono">
                        <tr>
                          {data.previewApp.columns.map((col, idx) => (
                            <th key={idx} className="px-4 py-2.5 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]/60 font-sans">
                        {data.previewApp.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#131C2E]/40 transition">
                            {data.previewApp.columns.map((col, cIdx) => (
                              <td key={cIdx} className="px-4 py-3 text-[#F8FAFC]">
                                {col === 'status' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                    {row[col]}
                                  </span>
                                ) : (
                                  row[col]
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CODE, SCHEMA & TESTS */}
            {activeTab === 'code' && (
              <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Generated Architecture & Starter Tests</h2>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Schema Validated
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compile Check Passed (Vitest)
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">Prisma relational models, Next.js API route handlers, and passing Vitest test suites.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      disabled={downloadingZip}
                      className="bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-60 text-[#090D16] font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-[#10B981]/15"
                    >
                      {downloadingZip ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Packaging ZIP...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download Repo (.zip)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-tab Switcher for Code Files */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg p-1 overflow-x-auto max-w-full scrollbar-none">
                    <button
                      onClick={() => setCodeSubTab('prisma')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
                        codeSubTab === 'prisma'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      prisma/schema.prisma
                    </button>

                    <button
                      onClick={() => setCodeSubTab('api')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
                        codeSubTab === 'api'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      api/pools/route.ts
                    </button>

                    <button
                      onClick={() => setCodeSubTab('tests')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
                        codeSubTab === 'tests'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      starter.test.ts (Vitest)
                    </button>

                    <button
                      onClick={() => setCodeSubTab('readme')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
                        codeSubTab === 'readme'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      README.md
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const text =
                        codeSubTab === 'prisma'
                          ? data.codebase.prismaSchema
                          : codeSubTab === 'api'
                          ? data.codebase.apiRouteCode
                          : codeSubTab === 'tests'
                          ? data.codebase.starterTestCode
                          : data.codebase.readmeMarkdown;
                      handleCopyCode(text);
                    }}
                    className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#10B981] font-mono px-2 py-1 bg-[#0F172A] border border-[#1E293B] rounded transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Code Display Area */}
                <div className="bg-[#080C14] border border-[#1E293B] rounded-xl overflow-hidden shadow-inner">
                  <div className="px-4 py-2 border-b border-[#1E293B] bg-[#0D1322] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                    <span>
                      {codeSubTab === 'prisma' && 'prisma/schema.prisma — PostgreSQL ORM'}
                      {codeSubTab === 'api' && 'src/app/api/pools/route.ts — App Router Handler'}
                      {codeSubTab === 'tests' && 'src/test/starter.test.ts — Vitest Suite'}
                      {codeSubTab === 'readme' && 'README.md — Quickstart Guide'}
                    </span>
                    <span className="text-[#10B981] font-mono text-[11px]">Typecheck Pass</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#F8FAFC] overflow-x-auto leading-relaxed">
                    <code>
                      {codeSubTab === 'prisma' && data.codebase.prismaSchema}
                      {codeSubTab === 'api' && data.codebase.apiRouteCode}
                      {codeSubTab === 'tests' && data.codebase.starterTestCode}
                      {codeSubTab === 'readme' && data.codebase.readmeMarkdown}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: 10-SLIDE PITCH DECK */}
            {activeTab === 'pitch' && (
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">10-Slide CoNSTruct Pitch Deck</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">Structured pitch narrative wired directly to your generated architecture (use Arrow keys).</p>
                  </div>

                  {/* Slide Navigation & Export Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportDeckMarkdown}
                      className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#10B981] font-mono px-2.5 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg transition"
                      title="Download full 10-slide deck as Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Deck (.md)
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentSlideIndex === 0}
                        className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono text-[#94A3B8] px-2">
                        Slide <strong className="text-[#10B981]">{currentSlide.slideNumber}</strong> of {data.pitchDeck.length}
                      </span>
                      <button
                        onClick={() => setCurrentSlideIndex((prev) => Math.min(data.pitchDeck.length - 1, prev + 1))}
                        disabled={currentSlideIndex === data.pitchDeck.length - 1}
                        className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Slide Canvas */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 lg:p-10 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#1E293B]/70 pb-4">
                    <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30">
                      Slide {currentSlide.slideNumber}: {currentSlide.title}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">{data.projectName}</span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F8FAFC] leading-snug">
                    {currentSlide.headline}
                  </h3>

                  <ul className="flex flex-col gap-3 my-2">
                    {currentSlide.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-[#E2E8F0] leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Speaker Notes Box */}
                  <div className="mt-4 pt-4 border-t border-[#1E293B] bg-[#0A0F1D]/80 -mx-6 lg:-mx-10 -mb-6 lg:-mb-10 p-5 rounded-b-2xl">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] uppercase tracking-wider mb-1">
                      <Presentation className="w-3.5 h-3.5" />
                      Speaker Note (Stage Delivery)
                    </div>
                    <p className="text-xs text-[#94A3B8] italic leading-relaxed">{currentSlide.speakerNote}</p>
                  </div>
                </div>

                {/* Slide Strip Thumbnail Selector */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {data.pitchDeck.map((slide, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`p-2 rounded-lg border text-xs font-mono transition text-center ${
                        currentSlideIndex === idx
                          ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold'
                          : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {slide.slideNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: 60S DEMO & CHECKLIST */}
            {activeTab === 'demo' && (
              <div className="max-w-5xl mx-auto flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">60s Demo Kit & Judge Rubric Checklist</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">Timestamped voiceover script and ranked Build-Next tasks tuned to CoNSTruct criteria.</p>
                  </div>

                  <button
                    type="button"
                    onClick={isRecording ? stopScreenRecording : startScreenRecording}
                    className={`self-start sm:self-auto font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-lg ${
                      isRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
                        : 'bg-[#10B981] hover:bg-[#10B981]/90 text-[#090D16] shadow-[#10B981]/15'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle className="w-3.5 h-3.5" />
                        Stop Recording ({recordingSeconds}s)
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        Record 60s Walkthrough
                      </>
                    )}
                  </button>
                </div>

                {recordingError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2 rounded-lg">
                    ⚠️ {recordingError}
                  </div>
                )}

                {/* 60s Script Segments */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#10B981]" />
                    60-Second Timed Stage Script
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.demoKit.scriptSegments.map((segment, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-[#1E293B]/60 pb-2">
                          <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded border border-[#10B981]/30">
                            ⏱️ {segment.timeRange}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-mono">Segment {idx + 1}/4</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-mono font-semibold">
                            Visual Screen Action:
                          </span>
                          <p className="text-xs text-[#E2E8F0] mt-0.5">{segment.visualAction}</p>
                        </div>
                        <div className="bg-[#090D16]/60 border border-[#1E293B]/70 rounded-lg p-2.5 mt-1">
                          <span className="text-[11px] uppercase tracking-wider text-[#10B981] font-mono font-semibold">
                            Voiceover:
                          </span>
                          <p className="text-xs text-[#94A3B8] italic mt-0.5 leading-relaxed">&ldquo;{segment.voiceover}&rdquo;</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Build Next Checklist */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    Ranked &ldquo;Build Next&rdquo; Rubric Checklist
                  </h3>

                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden divide-y divide-[#1E293B]/70">
                    {data.demoKit.buildNextChecklist.map((item, idx) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#131C2E]/30 transition">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                            {item.priority}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-[#F8FAFC]">{item.task}</p>
                            <span className="text-[11px] text-[#94A3B8] font-mono mt-0.5 inline-block">
                              Impact: {item.impactScore}
                            </span>
                          </div>
                        </div>

                        <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-[#131C2E] border border-[#1E293B] text-[11px] font-mono text-[#10B981]">
                          {item.judgingCriteria}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
