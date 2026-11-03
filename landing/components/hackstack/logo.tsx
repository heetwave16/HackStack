import { Layers } from 'lucide-react';

export function HackStackLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-600 text-white">
        <Layers className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-medium tracking-tight text-ink-900">HackStack</span>
    </span>
  );
}
