'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HackStackLogo } from './logo';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Live demo', href: '#demo' },
  { label: 'Judging', href: '#judging' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled || menuOpen ? 'border-ink-700/70 bg-ink-950/90 backdrop-blur-xl' : 'border-transparent bg-ink-950'}`}>
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <a href="#top" aria-label="HackStack home" className="shrink-0"><HackStackLogo /></a>
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => <li key={link.href}><a href={link.href} className="rounded-md px-3 py-2 text-sm text-ink-300 transition-colors hover:text-lime-300">{link.label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden bg-lime-300 text-ink-950 hover:bg-lime-200 md:inline-flex"><a href="#demo">Try the demo</a></Button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md text-ink-200 hover:bg-ink-800 md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {menuOpen ? <div id="mobile-menu" className="border-t border-ink-700 bg-ink-950 md:hidden"><ul className="flex flex-col gap-1 px-5 py-4">{NAV_LINKS.map((link) => <li key={link.href}><a href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 hover:text-lime-300">{link.label}</a></li>)}</ul></div> : null}
    </header>
  );
}
