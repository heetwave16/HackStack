import { Layers, Sparkles } from 'lucide-react';

export function HackStackLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-lime-300 text-ink-950 shadow-[0_0_24px_-8px_rgba(182,229,74,0.9)]">
        <Layers className="h-4 w-4" aria-hidden="true" />
        <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 text-lime-200" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink-50">HackStack<span className="text-lime-300">.</span></span>
    </span>
  );
}
