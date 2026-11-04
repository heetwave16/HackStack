'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2, CircleDot, FileText } from 'lucide-react';
import { CodeText, totalCodeLength, useTypewriter } from './code-view';

const HERO_CODE = ["import { z } from 'zod';", '', '// slot: api.route  |  validated before injection', 'const QueueTicket = z.object({', '  patientId: z.string().uuid(),', '  clinicId: z.string(),', '  position: z.number().int().min(1),', '});', '', 'export async function POST(req: Request) {', '  const ticket = QueueTicket.parse(await req.json());', "  return Response.json({ status: 'queued', ...ticket });", '} '];
const SLIDES = [
  { kicker: '01 / PROBLEM', title: 'Patients wait without knowing when they will be seen', points: ['No live position in the queue', 'Staff track the line on paper'] },
  { kicker: '04 / SOLUTION', title: 'Every patient sees a live position from their phone', points: ['One-tap join', 'Ticket schema validated before it is saved'] },
  { kicker: '07 / ARCHITECTURE', title: 'Next.js front end, Node API, Postgres queue', points: ['Claims resolved in one transaction', 'Single source of truth in Postgres'] },
];

export function HeroVisual() {
  const totalChars = totalCodeLength(HERO_CODE);
  const visibleChars = useTypewriter(totalChars, 16, 2600);
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => { const id = setInterval(() => setSlideIndex((index) => (index + 1) % SLIDES.length), 3800); return () => clearInterval(id); }, []);
  const slide = SLIDES[slideIndex];
  return (
    <div className="relative"><div className="absolute -inset-5 rounded-2xl border border-lime-300/10 bg-lime-300/[0.02]" /><div className="relative flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.9)]"><WindowBar title="app/api/queue/route.ts" status="running" /><div className="min-h-[278px] px-5 py-5"><CodeText lines={HERO_CODE} visibleChars={visibleChars} /></div><div className="flex items-center gap-2 border-t border-ink-700 bg-ink-800/80 px-4 py-3 font-mono text-[11px] text-lime-300"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Schema checked <span className="text-ink-500">·</span> slot added to starter</div></div>
      <div className="ml-8 overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.9)] sm:ml-16"><WindowBar title="pitch/deck.json" status="ready" /><div className="px-5 py-5 sm:px-6 sm:py-6"><div className="min-h-[150px]"><AnimatePresence mode="wait"><motion.div key={slide.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-lime-300">{slide.kicker}</p><h3 className="mt-3 font-display text-2xl font-medium leading-[1.15] text-ink-50">{slide.title}</h3><ul className="mt-4 space-y-2">{slide.points.map((point) => <li key={point} className="flex items-start gap-2.5 text-sm leading-[1.5] text-ink-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime-300" />{point}</li>)}</ul></motion.div></AnimatePresence></div><div className="mt-5 flex items-center gap-1.5" aria-hidden="true">{SLIDES.map((item, index) => <span key={item.title} className={`h-1 rounded-full transition-all duration-500 ${index === slideIndex ? 'w-8 bg-lime-300' : 'w-3 bg-ink-600'}`} />)}</div></div></div>
    </div><div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-3 py-2 font-mono text-[10px] text-ink-300 shadow-xl sm:flex"><CircleDot className="h-3 w-3 text-lime-300" />live output</div></div>
  );
}

function WindowBar({ title, status }: { title: string; status: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-800 px-4 py-3"><div className="flex items-center gap-3"><div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-ink-600" /><span className="h-2.5 w-2.5 rounded-full bg-ink-600" /><span className="h-2.5 w-2.5 rounded-full bg-ink-600" /></div><span className="truncate font-mono text-xs text-ink-300">{title}</span></div><span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400"><FileText className="h-3 w-3 text-lime-300" />{status}</span></div>;
}
