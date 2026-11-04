import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

export function FinalCta() {
  return <section aria-labelledby="final-cta-heading" className="relative overflow-hidden border-t border-ink-700 py-28 lg:py-36"><div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/5 blur-[120px]" /><div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8"><Reveal><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-300"><span className="mr-2 text-lime-500">//</span>Ready when you are</p><h2 id="final-cta-heading" className="mx-auto mt-5 max-w-2xl font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-50 sm:text-5xl lg:text-6xl">Run a sample brief first, then bring your own.</h2><p className="mx-auto mt-6 max-w-xl text-base leading-[1.6] text-ink-300 sm:text-lg">The demo runs in your browser with no sign-up, so you can see the full output before you write a line.</p><div className="mt-10 flex justify-center"><Button asChild size="lg" className="h-12 bg-lime-300 px-6 font-semibold text-ink-950 hover:bg-lime-200"><a href="#demo">Run the live demo<ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" /></a></Button></div></Reveal></div></section>;
}
