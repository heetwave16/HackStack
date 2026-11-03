import { SectionHeader } from './section-header';

const CRITERIA = [
  { name: 'Product thinking', prompt: 'Name the user and walk one journey from start to finish.' },
  { name: 'Innovation', prompt: 'Lead with the one idea that sets your project apart.' },
  { name: 'Use of AI', prompt: 'Show where the AI made a decision and how that output was checked.' },
  { name: 'Feasibility', prompt: 'Run the build live rather than showing a screenshot.' },
];

const BUILD_NEXT = [
  'Show the core flow working end to end',
  'Add the one feature the judges will ask about',
  'Tighten the pitch around your strongest result',
];

export function JudgingSection() {
  return (
    <section id="judging" aria-labelledby="judging-heading" className="scroll-mt-20 border-t border-paper-300 bg-paper-200/60 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-16 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <SectionHeader
            eyebrow="Judging criteria"
            title="Built around the four criteria judges use"
            description="Every run turns the criteria into a ranked list, so your last hours go to the gaps that matter most."
          />
          <div className="mt-10 rounded-xl border border-paper-300 bg-paper-50 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-500">Build next, ranked</p>
            <ol className="mt-4 space-y-4">
              {BUILD_NEXT.map((item, index) => (
                <li key={item} className="flex items-start gap-4 text-sm leading-[1.5] text-ink-800">
                  <span className="font-mono text-xs text-accent-600">{String(index + 1).padStart(2, '0')}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="divide-y divide-paper-300 border-y border-paper-300 self-start">
          {CRITERIA.map((criterion) => (
            <li key={criterion.name} className="py-6">
              <p className="font-display text-xl font-medium text-ink-900">{criterion.name}</p>
              <p className="mt-2 text-sm leading-[1.5] text-ink-500">{criterion.prompt}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
