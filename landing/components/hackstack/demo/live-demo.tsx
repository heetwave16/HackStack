'use client';

import { useEffect, useState } from 'react';
import { Download, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '../section-header';
import { Reveal } from '../reveal';
import { DEMO_SAMPLES } from './demo-data';
import { downloadDemoKit } from './build-demo-kit';
import { CodePanel, PitchPanel } from './demo-panels';
import { DemoGateBar } from './demo-gate-bar';
import { DEMO_DONE_TICK, useDemoRun } from './use-demo-run';

const KIT_CONFIRM_MS = 2500;

export function LiveDemo() {
  const [sampleId, setSampleId] = useState(DEMO_SAMPLES[0].id);
  const [runId, setRunId] = useState(1);
  const [kitDownloaded, setKitDownloaded] = useState(false);
  const sample = DEMO_SAMPLES.find((item) => item.id === sampleId) ?? DEMO_SAMPLES[0];
  const tick = useDemoRun(runId);
  const running = tick < DEMO_DONE_TICK;
  useEffect(() => { if (!kitDownloaded) return; const id = setTimeout(() => setKitDownloaded(false), KIT_CONFIRM_MS); return () => clearTimeout(id); }, [kitDownloaded]);
  const selectSample = (id: string) => { setSampleId(id); setRunId((value) => value + 1); };
  const regenerate = () => setRunId((value) => value + 1);
  const handleDownload = () => { downloadDemoKit(sample); setKitDownloaded(true); };
  return <section id="demo" className="scroll-mt-20 border-t border-ink-700 bg-ink-900 py-24 lg:py-32"><div className="mx-auto max-w-6xl px-5 lg:px-8"><Reveal><SectionHeader eyebrow="Live demo" title="Watch one brief become a build and a pitch" description="Pick a sample problem and run it. The code slot, the deck and the demo script all come from the same run." /></Reveal><Reveal delay={0.1}><div className="mt-14 overflow-hidden rounded-xl border border-ink-700 bg-ink-800/40"><div className="border-b border-ink-700 bg-ink-900 p-5 sm:p-6"><div role="group" aria-label="Sample hackathon problems" className="flex flex-wrap gap-2">{DEMO_SAMPLES.map((item) => { const active = item.id === sample.id; return <button key={item.id} type="button" aria-pressed={active} onClick={() => selectSample(item.id)} className={`rounded-md border px-3.5 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${active ? 'border-lime-300/60 bg-lime-300/10 text-lime-300' : 'border-ink-600 bg-ink-900 text-ink-300 hover:border-ink-500 hover:text-ink-100'}`}>{item.label}</button>; })}</div><div className="mt-5 rounded-md border border-ink-700 bg-ink-950 p-4 sm:p-5"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">Problem statement</p><p className="mt-2 text-sm leading-[1.55] text-ink-100 sm:text-base">{sample.statement}</p><p className="mt-3 font-mono text-xs text-lime-300">parsed → {sample.intent}</p></div></div><DemoGateBar tick={tick} /><div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:gap-6"><CodePanel key={`code-${runId}`} sample={sample} tick={tick} /><PitchPanel key={`pitch-${runId}`} sample={sample} tick={tick} /></div><div className="flex flex-col gap-3 border-t border-ink-700 bg-ink-900 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="font-mono text-xs text-ink-400" aria-live="polite">{running ? 'Generating the build and the pitch…' : 'Run complete. Your demo kit is ready.'}</p><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={regenerate} disabled={running} className="border-ink-600 bg-transparent text-ink-100 hover:bg-ink-800 hover:text-ink-50"><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Run again</Button><Button type="button" onClick={handleDownload} disabled={running} className="bg-lime-300 text-ink-950 hover:bg-lime-200">{kitDownloaded ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}{kitDownloaded ? 'Demo kit downloaded' : 'Download demo kit'}</Button></div></div></div></Reveal></div></section>;
}
