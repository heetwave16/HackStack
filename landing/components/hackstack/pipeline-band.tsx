const PIPELINE = ['Problem brief', 'Structured intent', 'Checked code', 'Pitch-ready story'];

export function PipelineBand() {
  return (
    <section aria-label="HackStack pipeline" className="border-y border-ink-700 bg-ink-800/60">
      <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-5 py-5 lg:px-8">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">One run</span>
        <div className="flex min-w-max items-center gap-3">
          {PIPELINE.map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lime-400/50 font-mono text-[10px] text-lime-300">0{index + 1}</span>
                <span className="text-sm text-ink-200">{item}</span>
              </div>
              {index < PIPELINE.length - 1 ? <span className="font-mono text-lime-400/60">→</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
