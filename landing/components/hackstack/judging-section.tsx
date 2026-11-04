import { Target, Lightbulb, Bot, Wrench } from 'lucide-react';
import { SectionHeader } from './section-header';
import { Reveal } from './reveal';

const CRITERIA = [
  { name: 'Product thinking', prompt: 'Name the user and walk one journey from start to finish.', icon: Target },
  { name: 'Innovation', prompt: 'Lead with the one idea that sets your project apart.', icon: Lightbulb },
  { name: 'Use of AI', prompt: 'Show where the AI made a decision and how that output was checked.', icon: Bot },
  { name: 'Feasibility', prompt: 'Run the build live rather than showing a screenshot.', icon: Wrench },
];
const BUILD_NEXT = ['Show the core flow working end to end', 'Add the one feature the judges will ask about', 'Tighten the pitch around your strongest result'];

export function JudgingSection() {
  return <section id="judging" aria-labelledby="judging-heading" className="scroll-mt-20 border-t border-ink-700 bg-ink-950 py-24 lg:py-32"><div className="mx-auto grid max-w-6xl gap-16 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8"><Reveal><div><SectionHeader eyebrow="Judging criteria" title="Built around the four criteria judges use" description="Every run turns the criteria into a ranked list, so your last hours go to the gaps that matter most." /><div className="mt-10 rounded-xl border border-ink-700 bg-ink-900 p-6"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime-300">Build next, ranked</p><ol className="mt-5 space-y-4">{BUILD_NEXT.map((item, index) => <li key={item} className="flex items-start gap-4 text-sm leading-[1.55] text-ink-100"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-lime-300/40 font-mono text-[10px] text-lime-300">{index + 1}</span>{item}</li>)}</ol></div></div></Reveal><Reveal delay={0.12}><ul className="space-y-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700">{CRITERIA.map((criterion) => { const Icon = criterion.icon; return <li key={criterion.name} className="group flex items-start gap-4 bg-ink-900 p-5 transition-colors hover:bg-ink-800/60"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-lime-300 transition-colors group-hover:border-lime-300/40"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="font-display text-xl font-medium text-ink-50">{criterion.name}</p><p className="mt-1.5 text-sm leading-[1.55] text-ink-400">{criterion.prompt}</p></div></li>; })}</ul></Reveal></div></section>;
}
