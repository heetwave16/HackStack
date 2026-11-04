import { Check, Loader2, X } from 'lucide-react';
import type { RunStep } from './types';
import { formatDuration } from './format';
import { SECTION_LABEL } from './ui';

export default function RunLog({ steps }: { steps: RunStep[] }) {
  return (
    <section aria-label="Run log" className="flex flex-col gap-3 border-t border-line pt-5">
      <h2 className="eyebrow">Session notes</h2>
      {steps.length === 0 ? (
        <p className="text-sm leading-relaxed text-fg-3">No run yet. Each step of a generation appears here with its timing.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-start gap-2">
                {step.status === 'running' && <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-info" aria-hidden="true" />}
                {step.status === 'done' && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />}
                {step.status === 'failed' && <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />}
                <span className="break-words font-mono text-xs leading-relaxed text-fg-2">{step.label}</span>
              </span>
              {step.ms !== undefined && (
                <span className="shrink-0 font-mono text-xs tabular-nums text-fg-3">{formatDuration(step.ms)}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
