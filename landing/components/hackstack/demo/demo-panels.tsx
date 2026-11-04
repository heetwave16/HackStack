'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileCode2, Presentation, ListChecks, Mic } from 'lucide-react';
import { CodeText, totalCodeLength } from '../code-view';
import type { DemoSample } from './demo-data';

const CHARS_PER_TICK = 12;
const SLIDE_TICKS = 11;
const SCRIPT_TICKS = 10;
const CHECKLIST_TICK = 44;
type PanelProps = { sample: DemoSample; tick: number };

export function CodePanel({ sample, tick }: PanelProps) {
  const total = totalCodeLength(sample.slotLines);
  const visibleChars = Math.min(total, tick * CHARS_PER_TICK);
  const validated = visibleChars >= total;
  return <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-ink-600 bg-ink-900"><div className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-800 px-4 py-3"><span className="flex min-w-0 items-center gap-2 font-mono text-xs text-ink-200"><FileCode2 className="h-3.5 w-3.5 shrink-0 text-lime-300" aria-hidden="true" /><span className="truncate">{sample.slotFile}</span></span><span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${validated ? 'border border-lime-300/30 bg-lime-300/10 text-lime-300' : 'border border-warning-600/30 bg-warning-50/10 text-warning-600'}`}>{validated ? 'slot validated' : 'adding slot'}</span></div><div className="flex-1 overflow-auto px-5 py-5"><CodeText lines={sample.slotLines} visibleChars={visibleChars} /></div><div className="border-t border-ink-700 bg-ink-800 px-4 py-2.5 font-mono text-[11px] text-ink-400">{validated ? 'Schema check passed · slot added to the starter' : 'Checking slot against its schema…'}</div></div>;
}

export function PitchPanel({ sample, tick }: PanelProps) {
  const slideIndex = Math.min(sample.slides.length - 1, Math.floor(tick / SLIDE_TICKS));
  const scriptCount = Math.min(sample.script.length, Math.floor(tick / SCRIPT_TICKS) + 1);
  const checklistVisible = tick >= CHECKLIST_TICK;
  const slide = sample.slides[slideIndex];
  return <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-ink-600 bg-ink-900"><div className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-800 px-4 py-3"><span className="flex items-center gap-2 font-mono text-xs text-ink-200"><Presentation className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" />pitch/deck.json</span><span className="font-mono text-[11px] text-ink-400">slide {String(slideIndex + 1).padStart(2, '0')} / {String(sample.slides.length).padStart(2, '0')}</span></div><div className="flex-1 space-y-6 overflow-auto p-5"><div className="relative min-h-[150px] overflow-hidden rounded-md border border-ink-700 bg-ink-950 p-5"><AnimatePresence mode="wait"><motion.div key={slide.kicker} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-lime-300">{slide.kicker}</p><p className="mt-2 font-display text-lg font-medium leading-[1.25] text-ink-50">{slide.title}</p><ul className="mt-3 space-y-1.5">{slide.points.map((point) => <li key={point} className="text-xs leading-[1.5] text-ink-300">· {point}</li>)}</ul></motion.div></AnimatePresence></div><div><p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400"><Mic className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" /> teleprompter script</p><ol className="space-y-2">{sample.script.slice(0, scriptCount).map((item, index) => <motion.li key={item.time} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex gap-3 rounded-md border border-ink-700 bg-ink-950 px-3 py-2.5"><span className="shrink-0 font-mono text-[11px] text-lime-300">{item.time}</span><span className="text-xs leading-[1.5] text-ink-200">{item.line}{index === scriptCount - 1 && scriptCount < sample.script.length ? <span className="ml-1 inline-block h-3 w-[2px] translate-y-[2px] animate-pulse bg-lime-300" aria-hidden="true" /> : null}</span></motion.li>)}</ol></div>{checklistVisible ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}><p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400"><ListChecks className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" /> build next · ranked</p><ul className="space-y-2.5">{sample.checklist.map((entry, index) => <li key={entry.item} className="flex items-start gap-3 text-xs leading-[1.5]"><span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ink-600 bg-ink-800 font-mono text-[10px] text-lime-300">{index + 1}</span><span className="text-ink-300"><span className="font-semibold text-ink-50">{entry.criterion}: </span>{entry.item}</span><CheckCircle2 className="ml-auto mt-0.5 hidden h-3.5 w-3.5 shrink-0 text-ink-600 sm:block" aria-hidden="true" /></li>)}</ul></motion.div> : null}</div></div>;
}
