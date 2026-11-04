type SectionHeaderProps = { eyebrow: string; title: string; description?: string; light?: boolean };

export function SectionHeader({ eyebrow, title, description, light = false }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl">
      <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${light ? 'text-lime-300' : 'text-lime-400'}`}><span className="mr-2 text-lime-500">//</span>{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-ink-50 sm:text-5xl">{title}</h2>
      {description ? <p className={`mt-5 max-w-xl text-base leading-[1.65] sm:text-lg ${light ? 'text-ink-300' : 'text-ink-400'}`}>{description}</p> : null}
    </div>
  );
}
