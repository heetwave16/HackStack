import { ClipboardPaste, Code2, Presentation } from 'lucide-react';
import { SectionHeader } from './section-header';
import { Reveal } from './reveal';

const STEPS = [
  { step: '01', title: 'Paste the problem', body: 'HackStack reads the intent, the users, and the judging angle before it writes any code.', output: 'intent: food_rescue · users: students, dining staff', icon: ClipboardPaste },
  { step: '02', title: 'Fill checked slots', body: 'The AI fills typed slots such as schemas, API routes and components into a locked starter. Each slot is validated before it is added.', output: 'slot: db.schema · schema check passed', icon: Code2 },
  { step: '03', title: 'Get the pitch with the build', body: 'The deck, a timed demo script and a ranked to-do list are written from the same run, so the story matches the code.', output: 'deck · 60-second script · ranked checklist', icon: Presentation },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-ink-700 bg-ink-900 py-24 lg:py-32"><div className="mx-auto max-w-6xl px-5 lg:px-8"><Reveal><SectionHeader eyebrow="How it works" title="One brief in, a build and a pitch out" description="The starter app is locked, so the AI only changes the parts it is allowed to change." /></Reveal><div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 md:grid-cols-3">{STEPS.map((step, index) => { const Icon = step.icon; return <Reveal key={step.step} delay={index * 0.1}><div className="group h-full bg-ink-900 p-7 transition-colors hover:bg-ink-800/60"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-lime-300 transition-colors group-hover:border-lime-300/40"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="font-mono text-2xl font-light text-ink-600">{step.step}</span></div><h3 className="mt-6 font-display text-2xl font-medium leading-[1.15] text-ink-50">{step.title}</h3><p className="mt-3 text-sm leading-[1.65] text-ink-400">{step.body}</p><div className="mt-6 rounded-md border border-ink-700 bg-ink-950 px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-lime-300"><span className="text-ink-500">$ </span>{step.output}</div></div></Reveal>; })}</div></div></section>
  );
}
