type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-600">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-ink-900 sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-5 text-base leading-[1.5] text-ink-500 sm:text-lg">{description}</p> : null}
    </div>
  );
}
