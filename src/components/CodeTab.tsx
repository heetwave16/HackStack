'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Cpu, Copy, Database, Download, FileCode, Loader2, Terminal, X } from 'lucide-react';
import { HackStackOutput } from '@/types/hackstack';
import { buildEnvExample, downloadHackStackZip } from '@/lib/packager';
import { languageFor, TOKEN_CLASS, tokenizeLine } from './code-tokens';

interface CodeTabProps {
  data: HackStackOutput;
}

interface CodeFile {
  id: string;
  folder: string;
  name: string;
  icon: typeof Database;
  description: string;
  code: string;
}

export default function CodeTab({ data }: CodeTabProps) {
  const files: CodeFile[] = [
    {
      id: 'prisma',
      folder: 'prisma',
      name: 'schema.prisma',
      icon: Database,
      description: 'PostgreSQL relational schema and models',
      code: data.codebase.prismaSchema,
    },
    {
      id: 'api',
      folder: 'src/app/api/main',
      name: 'route.ts',
      icon: FileCode,
      description: 'Next.js App Router API route handler',
      code: data.codebase.apiRouteCode,
    },
    {
      id: 'tests',
      folder: 'tests',
      name: 'starter.test.ts',
      icon: Check,
      description: 'Vitest unit test suite (starter)',
      code: data.codebase.starterTestCode,
    },
    {
      id: 'readme',
      folder: '',
      name: 'README.md',
      icon: FileCode,
      description: 'Developer setup and quickstart guide',
      code: data.codebase.readmeMarkdown,
    },
    {
      id: 'env',
      folder: '',
      name: '.env.example',
      icon: Terminal,
      description: 'Environment variables template',
      code: buildEnvExample(data.projectName),
    },
  ];

  const [activeId, setActiveId] = useState<string>('prisma');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const activeFile = files.find((file) => file.id === activeId) ?? files[0];
  const language = languageFor(activeFile.name);
  const lines = activeFile.code.split('\n');
  const filePath = activeFile.folder ? `${activeFile.folder}/${activeFile.name}` : activeFile.name;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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

  const checks = [
    { label: 'Schema valid', ok: data.validation.schemaValid, passText: 'Passed', failText: 'Failed' },
    { label: 'Static code check', ok: data.validation.compileCheckPassed, passText: 'Passed', failText: 'Needs review' },
    { label: 'Source', ok: !data.validation.usedFallback, passText: 'Model output', failText: 'Offline fallback' },
  ];

  const folders = Array.from(new Set(files.map((file) => file.folder)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Code</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg sm:text-2xl">Architecture and starter tests</h2>
          <p className="mt-1 text-sm text-fg-3">Schema, API route, tests, README, and environment template for the starter repo.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover disabled:opacity-60 sm:self-auto"
        >
          {isZipping ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {isZipping ? 'Packaging starter repo' : 'Download starter repo (.zip)'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5">
          <nav aria-label="Project files" className="flex flex-col gap-3">
            {folders.map((folder) => (
              <div key={folder || 'root'} className="flex flex-col gap-1">
                {folder && (
                  <span className="px-2 font-mono text-xs text-fg-3">{folder}/</span>
                )}
                {files
                  .filter((file) => file.folder === folder)
                  .map((file) => {
                    const Icon = file.icon;
                    const isActive = file.id === activeFile.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setActiveId(file.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                          folder ? 'ml-3' : ''
                        } ${isActive ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:bg-surface-1 hover:text-fg'}`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-fg-3'}`} aria-hidden="true" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </nav>

          <section aria-label="Validation" className="flex flex-col gap-3 rounded border border-line bg-surface-1 p-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-fg-3">Validation</h3>
            <ul className="flex flex-col gap-2">
              {checks.map((check) => (
                <li key={check.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-fg-2">{check.label}</span>
                  <span className={`inline-flex items-center gap-1.5 font-mono ${check.ok ? 'text-success' : 'text-warning'}`}>
                    {check.ok ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {check.ok ? check.passText : check.failText}
                  </span>
                </li>
              ))}
            </ul>
            <p className="inline-flex items-center gap-2 border-t border-line pt-3 font-mono text-xs text-fg-3">
              <Cpu className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {data.validation.modelUsed || 'Golden preset'}
            </p>
            {data.validation.usedFallback && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-fg-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
                No model answered this run, so this code was built offline from your brief.
              </p>
            )}
          </section>
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-0">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-1 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2 font-mono text-xs">
              <span className="truncate text-fg">{filePath}</span>
              <span className="hidden truncate text-fg-3 md:inline">{activeFile.description}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-xs text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy file
                </>
              )}
            </button>
          </div>

          <div className="flex max-h-[560px] overflow-auto font-mono text-xs leading-6">
            <div aria-hidden="true" className="select-none border-r border-line bg-surface-1 px-3 py-4 text-right tabular-nums text-fg-3">
              {lines.map((_, index) => (
                <div key={index} className="min-h-6">
                  {index + 1}
                </div>
              ))}
            </div>
            <pre className="min-w-0 flex-1 py-4 pl-4 pr-6">
              <code className="block">
                {lines.map((line, index) => (
                  <div key={index} className="min-h-6 whitespace-pre">
                    {tokenizeLine(line, language).map((token, tokenIndex) => (
                      <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                        {token.text}
                      </span>
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
