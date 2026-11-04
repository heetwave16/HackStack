import Link from 'next/link';
import { ArrowLeft, ExternalLink, LockKeyhole } from 'lucide-react';
import { getSharedProject } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await getSharedProject(token);

  if (!shared) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="workbench-panel w-full max-w-lg p-8">
          <p className="eyebrow">Share link unavailable</p>
          <h1 className="mt-3 text-2xl font-semibold">This project link has expired or been revoked.</h1>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover">
            <ArrowLeft className="h-4 w-4" /> Open HackStack
          </Link>
        </div>
      </main>
    );
  }

  const { project, canEdit } = shared;
  const result = project.result;

  return (
    <main className="min-h-screen px-5 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-fg-3 hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> HackStack workbench
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-wider text-fg-3">
            <LockKeyhole className="h-3 w-3 text-accent" /> {canEdit ? 'Shared edit access' : 'Read-only share'}
          </span>
        </div>

        <header className="mt-12 max-w-3xl">
          <p className="eyebrow">Project share · {project.stack}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg lg:text-6xl">{project.project_name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-2">{result.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-fg-3">{project.idea}</p>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {result.previewApp.metrics.map((metric) => (
            <article key={metric.label} className="workbench-panel p-5">
              <p className="eyebrow">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-fg">{metric.value}</p>
              <p className="mt-2 text-xs text-accent">{metric.trend}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="workbench-panel overflow-hidden">
            <div className="border-b border-line p-5">
              <p className="eyebrow">Preview · {result.previewApp.primaryEntityName}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-fg-3">
                  <tr>{result.previewApp.columns.map((column) => <th key={column} className="px-5 py-3 font-medium">{column}</th>)}</tr>
                </thead>
                <tbody>
                  {result.previewApp.sampleRows.map((row, index) => (
                    <tr key={index} className="border-b border-line/70 last:border-0">
                      {result.previewApp.columns.map((column) => <td key={column} className="px-5 py-4 text-fg-2">{row[column]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="workbench-panel p-5">
            <p className="eyebrow">Build next</p>
            <div className="mt-4 flex flex-col gap-4">
              {result.demoKit.buildNextChecklist.map((item) => (
                <div key={item.priority} className="border-l-2 border-accent/50 pl-3">
                  <p className="text-sm font-medium text-fg">{item.task}</p>
                  <p className="mt-1 text-xs text-fg-3">{item.judgingCriteria} · {item.impactScore}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="mt-10 flex items-center justify-between border-t border-line pt-5 text-xs text-fg-3">
          <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
          <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-accent-hover">
            Build your own <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
