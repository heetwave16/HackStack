import { SiteNav } from '@/components/hackstack/site-nav';
import { Hero } from '@/components/hackstack/hero';
import { PipelineBand } from '@/components/hackstack/pipeline-band';
import { HowItWorks } from '@/components/hackstack/how-it-works';
import { LiveDemo } from '@/components/hackstack/demo/live-demo';
import { JudgingSection } from '@/components/hackstack/judging-section';
import { FinalCta } from '@/components/hackstack/final-cta';
import { SiteFooter } from '@/components/hackstack/site-footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <SiteNav />
      <main>
        <Hero />
        <PipelineBand />
        <HowItWorks />
        <LiveDemo />
        <JudgingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
