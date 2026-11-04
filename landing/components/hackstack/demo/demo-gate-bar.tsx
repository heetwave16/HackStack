import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { DEMO_DONE_TICK } from './use-demo-run';

const GATES = [{ label: 'Zod schema', at: 12 }, { label: 'tsc --noEmit', at: 26 }, { label: 'Model fallback chain', at: 34 }, { label: 'Sandbox health', at: 42 }];
type GateBarProps = { tick: number };

export function DemoGateBar({ tick }: GateBarProps) {
  const done = tick >= DEMO_DONE_TICK;
  const passed = GATES.filter((gate) => tick >= gate.at).length;
  return <div className="flex flex-col gap-3 border-y border-ink-700 bg-ink-800/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex flex-wrap items-center gap-2" role="status" aria-live="polite"><span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">Checks</span>{GATES.map((gate, index) => { const isPassed = tick >= gate.at; const isRunning = !isPassed && tick >= (GATES[index - 1]?.at ?? 0); return <span key={gate.label} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-300 ${isPassed ? 'border-lime-300/30 bg-lime-300/10 text-lime-300' : isRunning ? 'border-info-600/30 bg-info-50/10 text-info-600' : 'border-ink-600 bg-ink-900 text-ink-500'}`}>{isPassed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : isRunning ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}{gate.label}</span>; })}</div><p className="font-mono text-xs text-ink-300">{done ? <span className="text-lime-300">All {GATES.length} checks passed</span> : <span>{passed} / {GATES.length} checks passed…</span>}</p></div>;
}
