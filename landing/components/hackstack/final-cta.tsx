import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="border-t border-paper-300 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <h2 id="final-cta-heading" className="font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-ink-900 sm:text-5xl">
          Run a sample brief first, then bring your own.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-[1.5] text-ink-500 sm:text-lg">
          The demo runs in your browser with no sign-up, so you can see the full output before you write a line.
        </p>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="h-12 bg-accent-600 px-6 text-white hover:bg-accent-700">
            <a href="#demo">
              Try the live demo
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
