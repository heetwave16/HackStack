import { SectionHeader } from './section-header';

const STEPS = [
  {
    step: '01',
    title: 'Paste the problem',
    body: 'HackStack reads the intent, the users, and the judging angle before it writes any code.',
    output: 'intent: food_rescue · users: students, dining staff',
  },
  {
    step: '02',
    title: 'Fill checked slots',
    body: 'The AI fills typed slots such as schemas, API routes and components into a locked starter. Each slot is validated before it is added.',
    output: 'slot: db.schema · schema check passed',
  },
  {
    step: '03',
    title: 'Get the pitch with the build',
    body: 'The deck, a timed demo script and a ranked to-do list are written from the same run, so the story matches the code.',
    output: 'deck · 60-second script · ranked checklist',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-paper-300 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="One brief in, a build and a pitch out"
          description="The starter app is locked, so the AI only changes the parts it is allowed to change."
        />

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <li key={step.step} className="border-t border-ink-900 pt-6">
              <span className="font-mono text-xs text-ink-500">{step.step}</span>
              <h3 className="mt-4 font-display text-2xl font-medium leading-[1.2] text-ink-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-[1.5] text-ink-500">{step.body}</p>
              <p className="mt-6 border-l-2 border-accent-600 pl-3 font-mono text-xs leading-[1.6] text-ink-700">
                {step.output}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
