'use client';

import React, { useState } from 'react';
import {
  Database,
  FileCode,
  Copy,
  Check,
  Download,
  Loader2,
  Terminal,
  Cpu
} from 'lucide-react';
import { HackStackOutput } from '@/types/hackstack';
import { buildEnvExample, downloadHackStackZip } from '@/lib/packager';

interface CodeTabProps {
  data: HackStackOutput;
}

type CodeSubTab = 'prisma' | 'api' | 'tests' | 'readme' | 'env';

export default function CodeTab({ data }: CodeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CodeSubTab>('prisma');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const envExampleContent = buildEnvExample(data.projectName);

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
          description: 'Vitest Unit Test Suite (Starter)',
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

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadHackStackZip(data);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const fileTabs: { id: CodeSubTab; label: string; icon: typeof Database }[] = [
    { id: 'prisma', label: 'prisma/schema.prisma', icon: Database },
    { id: 'api', label: 'src/app/api/main/route.ts', icon: FileCode },
    { id: 'tests', label: 'tests/starter.test.ts', icon: Check },
    { id: 'readme', label: 'README.md', icon: FileCode },
    { id: 'env', label: '.env.example', icon: Terminal }
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              Generated Architecture & Starter Tests
            </h2>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#94A3B8] px-2.5 py-0.5 rounded border border-[#1E293B] bg-[#0F172A]">
              <Cpu className="w-3 h-3 text-[#10B981]" aria-hidden="true" />
              {data.validation.modelUsed || 'Golden Preset'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Prisma schema, Next.js App Router handler, starter tests, and environment template.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="self-start lg:self-auto bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-[#090D16] font-semibold text-xs sm:text-sm py-2 px-4 rounded-md flex items-center gap-2 transition-colors shrink-0"
        >
          {isZipping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Packaging starter repo...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download starter repo (.zip)</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-md p-1 overflow-x-auto max-w-full scrollbar-none">
          {fileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[#10B981]/15 text-[#10B981] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="self-end sm:self-auto flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#10B981] font-mono px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] hover:border-[#10B981]/40 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
              <span className="text-[#10B981] font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy file</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-[#080C14] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-[#1E293B] bg-[#0D1322] flex items-center gap-2 text-xs font-mono text-[#94A3B8] min-w-0">
          <span className="text-[#CBD5E1] font-medium truncate">{activeFile.filename}</span>
          <span className="hidden sm:inline text-[#64748B] truncate">- {activeFile.description}</span>
        </div>

        <pre className="p-4 text-xs font-mono text-[#F8FAFC] overflow-x-auto leading-relaxed max-h-[600px] selection:bg-[#10B981]/30">
          <code>{activeFile.code}</code>
        </pre>
      </div>
    </div>
  );
}
