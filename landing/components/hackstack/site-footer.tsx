import { HackStackLogo } from './logo';

const FOOTER_LINKS = [{ label: 'How it works', href: '#how-it-works' }, { label: 'Live demo', href: '#demo' }, { label: 'Judging criteria', href: '#judging' }];

export function SiteFooter() {
  return <footer className="border-t border-ink-700 bg-ink-950"><div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between lg:px-8"><div><HackStackLogo /><p className="mt-4 max-w-xs text-sm leading-[1.6] text-ink-400">The AI code and pitch workbench for hackathon teams.</p></div><ul className="flex flex-col gap-3 text-sm sm:items-end">{FOOTER_LINKS.map((link) => <li key={link.href}><a href={link.href} className="text-ink-400 transition-colors hover:text-lime-300">{link.label}</a></li>)}</ul></div><div className="border-t border-ink-700"><p className="mx-auto max-w-6xl px-5 py-6 font-mono text-[11px] text-ink-500 lg:px-8">© 2026 HackStack · built for the weekend</p></div></footer>;
}
