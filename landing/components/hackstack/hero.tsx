import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroVisual } from './hero-visual';

export function Hero() {
  return (
    <section id="top" className="pb-24 pt-32 sm:pt-36 lg:pb-32 lg:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-600">For hackathon teams</p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-ink-900 sm:text-6xl">
            Turn a hackathon brief into a running app and a pitch.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-[1.5] text-ink-500">
            HackStack builds a Next.js, Node and Postgres starter from your problem statement. It also writes a
            deck, a timed demo script and a ranked to-do list for the judging criteria.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-accent-600 px-6 text-white hover:bg-accent-700">
              <a href="#demo">
                Try the live demo
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-paper-300 bg-transparent px-6 text-ink-800 hover:bg-paper-200"
            >
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
          <p className="mt-5 font-mono text-xs text-ink-500">No sign-up needed for the demo</p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
