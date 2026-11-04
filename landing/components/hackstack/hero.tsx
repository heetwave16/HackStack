import { ArrowUpRight, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroVisual } from './hero-visual';
import { Reveal } from './reveal';

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-grid-dim pt-32 sm:pt-40 lg:pt-44">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-lime-300/5 blur-[120px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-5 pb-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8 lg:pb-28">
        <div>
          <Reveal><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1.5 font-mono text-[11px] text-lime-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" />The hackathon workbench</div></Reveal>
          <Reveal delay={0.08}><h1 className="max-w-2xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-ink-50 sm:text-7xl lg:text-[5.25rem]">Your best idea deserves a <span className="text-lime-300">better first draft.</span></h1></Reveal>
          <Reveal delay={0.16}><p className="mt-7 max-w-lg text-lg leading-[1.6] text-ink-300">HackStack turns the messy first hours of a hackathon into a checked build, a sharp pitch, and a clear path to the finish line.</p></Reveal>
          <Reveal delay={0.24}><div className="mt-10 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 bg-lime-300 px-6 font-semibold text-ink-950 hover:bg-lime-200"><a href="#demo">Run the demo<ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" /></a></Button><Button asChild size="lg" variant="outline" className="h-12 border-ink-600 bg-transparent px-6 text-ink-100 hover:bg-ink-800 hover:text-ink-50"><a href="#how-it-works"><Terminal className="mr-2 h-4 w-4 text-lime-300" aria-hidden="true" />See the workflow</a></Button></div></Reveal>
          <Reveal delay={0.32}><div className="mt-8 flex items-center gap-3 font-mono text-[11px] text-ink-400"><span className="h-px w-8 bg-lime-300/60" />No sign-up · no invented traction · just a working starting point</div></Reveal>
        </div>
        <Reveal delay={0.18}><HeroVisual /></Reveal>
      </div>
    </section>
  );
}
