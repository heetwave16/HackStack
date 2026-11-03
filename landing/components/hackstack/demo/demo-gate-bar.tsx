import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { DEMO_DONE_TICK } from './use-demo-run';

const GATES = [
  { label: 'Zod schema', at: 12 },
  { label: 'tsc --noEmit', at: 26 },
  { label: 'Model fallback chain', at: 34 },
  { label: 'Sandbox health', at: 42 },
];

type GateBarProps = { tick: number };

export function DemoGateBar({ tick }: GateBarProps) {
  const done = tick >= DEMO_DONE_TICK;
  const passed = GATES.filter((gate) => tick >= gate.at).length;

  return (
    <div className="flex flex-col gap-3 border-y border-paper-300 bg-paper-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-2" role="status" aria-live="polite">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">Checks</span>
        {GATES.map((gate, index) => {
          const isPassed = tick >= gate.at;
          const isRunning = !isPassed && tick >= (GATES[index - 1]?.at ?? 0);
          return (
            <span
              key={gate.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-300 ${
                isPassed
                  ? 'border-success-600/30 bg-success-50 text-success-600'
                  : isRunning
                    ? 'border-info-600/30 bg-info-50 text-info-600'
                    : 'border-paper-300 bg-paper-50 text-ink-500'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              ) : isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
              {gate.label}
            </span>
          );
        })}
      </div>
      <p className="font-mono text-xs text-ink-600">
        {done ? (
          <span className="text-success-600">All {GATES.length} checks passed</span>
        ) : (
          <span>
            {passed} / {GATES.length} checks passed…
          </span>
        )}
      </p>
    </div>
  );
}
