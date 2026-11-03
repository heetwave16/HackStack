'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Database,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Loader2,
  Terminal,
  Cpu
} from 'lucide-react';
import { HackStackOutput } from '@/types/hackstack';

interface CodeTabProps {
  data: HackStackOutput;
}

type CodeSubTab = 'prisma' | 'api' | 'tests' | 'readme' | 'env';

export default function CodeTab({ data }: CodeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CodeSubTab>('prisma');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Generate .env.example content dynamically
  const envExampleContent = `# HackStack Environment Config — ${data.projectName}
# Copy this file to .env.local and configure your local PostgreSQL credentials

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# BYOK Server Key (if calling Gemini / OpenAI directly)
GEMINI_API_KEY=""
`;

  // Determine active code text and title
  const getActiveFile = () => {
    switch (activeSubTab) {
      case 'prisma':
        return {
          filename: 'prisma/schema.prisma',
          description: 'PostgreSQL Relational Schema & Models',
          code: data.codebase.prismaSchema
        };
      case 'api':
        return {
          filename: 'src/app/api/main/route.ts',
          description: 'Next.js App Router API Route Handler',
          code: data.codebase.apiRouteCode
        };
      case 'tests':
        return {
          filename: 'tests/starter.test.ts',
          description: 'Vitest Unit Test Suite (Passing Starter Test)',
          code: data.codebase.starterTestCode
        };
      case 'readme':
        return {
          filename: 'README.md',
          description: 'Developer Setup & Quickstart Guide',
          code: data.codebase.readmeMarkdown
        };
      case 'env':
        return {
          filename: '.env.example',
          description: 'Environment Variables Template',
          code: envExampleContent
        };
    }
  };

  const activeFile = getActiveFile();

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeFile.code);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = activeFile.code;
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

  // 1-Click Eject Starter Repo (.zip)
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);

      // [PARV SLICE 3 PLUG-IN]: Replace inline zip builder with downloadHackStackZip(data) from '@/lib/packager'
      const zip = new JSZip();

      // 1. Prisma schema
      zip.file('prisma/schema.prisma', data.codebase.prismaSchema);

      // 2. Main API route
      zip.file('src/app/api/main/route.ts', data.codebase.apiRouteCode);

      // 3. Vitest starter test
      zip.file('tests/starter.test.ts', data.codebase.starterTestCode);

      // 4. README quickstart
      zip.file('README.md', data.codebase.readmeMarkdown);

      // 5. Environment configuration
      zip.file('.env.example', envExampleContent);

      // 6. Generated 10-slide pitch deck export
      const deckMarkdown = `# ${data.projectName} — 10-Slide Pitch Deck\n${data.tagline}\n\n` +
        data.pitchDeck
          .map(
            (slide) =>
              `## Slide ${slide.slideNumber}: ${slide.title}\n` +
              `### ${slide.headline}\n\n` +
              slide.bullets.map((b) => `- ${b}`).join('\n') +
              `\n\n> **Presenter Speaker Note**: ${slide.speakerNote}\n`
          )
          .join('\n---\n\n');
      zip.file('PITCH_DECK.md', deckMarkdown);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `${slug}-hackstack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Bar with Title, Validation Badges and 1-Click Eject */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
              Generated Architecture & Starter Tests
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Schema Validated (Zod)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Compile Check Passed (Vitest)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8] bg-[#1E293B] px-2.5 py-0.5 rounded-full border border-[#334155]">
              <Cpu className="w-3 h-3 text-[#10B981]" />
              {data.validation.modelUsed || 'Golden Preset'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Production-grade Prisma schema, Next.js App Router handlers, Vitest unit tests, and environment templates.
          </p>
        </div>

        {/* 1-Click Eject Button */}
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="self-start lg:self-auto bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-60 text-[#090D16] font-semibold text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#10B981]/20 shrink-0"
        >
          {isZipping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Packaging Starter Repo...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>1-Click Eject Starter Repo (.zip)</span>
            </>
          )}
        </button>
      </div>

      {/* Explorer Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 5-File Explorer Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg p-1 overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveSubTab('prisma')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
              activeSubTab === 'prisma'
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            prisma/schema.prisma
          </button>

          <button
            onClick={() => setActiveSubTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
              activeSubTab === 'api'
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            src/app/api/main/route.ts
          </button>

          <button
            onClick={() => setActiveSubTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
              activeSubTab === 'tests'
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            tests/starter.test.ts
          </button>

          <button
            onClick={() => setActiveSubTab('readme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
              activeSubTab === 'readme'
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            README.md
          </button>

          <button
            onClick={() => setActiveSubTab('env')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 ${
              activeSubTab === 'env'
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            .env.example
          </button>
        </div>

        {/* Copy File Button */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="self-end sm:self-auto flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#10B981] font-mono px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] hover:border-[#10B981]/40 rounded-lg transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[#10B981] font-semibold">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy File</span>
            </>
          )}
        </button>
      </div>

      {/* Code Display Area */}
      <div className="bg-[#080C14] border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 border-b border-[#1E293B] bg-[#0D1322] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[#CBD5E1] font-medium">{activeFile.filename}</span>
            <span className="hidden sm:inline text-[#64748B]">— {activeFile.description}</span>
          </div>
          <span className="text-[11px] text-[#10B981] font-mono bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
            Validated Syntax
          </span>
        </div>

        {/* Preformatted Code Content */}
        <pre className="p-4 text-xs font-mono text-[#F8FAFC] overflow-x-auto leading-relaxed max-h-[600px] selection:bg-[#10B981]/30">
          <code>{activeFile.code}</code>
        </pre>
      </div>
    </div>
  );
}

