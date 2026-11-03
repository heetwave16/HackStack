'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CodeText, totalCodeLength, useTypewriter } from './code-view';

const HERO_CODE = [
  "import { z } from 'zod';",
  '',
  '// slot: api.route  |  validated before injection',
  'const QueueTicket = z.object({',
  '  patientId: z.string().uuid(),',
  '  clinicId: z.string(),',
  '  position: z.number().int().min(1),',
  '});',
  '',
  'export async function POST(req: Request) {',
  '  const ticket = QueueTicket.parse(await req.json());',
  "  return Response.json({ status: 'queued', ...ticket });",
  '}',
];

const SLIDES = [
  {
    kicker: 'Slide 01 · Problem',
    title: 'Patients wait without knowing when they will be seen',
    points: ['No live position in the queue', 'Staff track the line on paper'],
  },
  {
    kicker: 'Slide 04 · Solution',
    title: 'Every patient sees a live position from their phone',
    points: ['One-tap join', 'Ticket schema validated before it is saved'],
  },
  {
    kicker: 'Slide 07 · Architecture',
    title: 'Next.js front end, Node API, Postgres queue',
    points: ['Ticket claims resolved in one transaction', 'Single source of truth in Postgres'],
  },
];

const SLIDE_INTERVAL_MS = 3800;

export function HeroVisual() {
  const totalChars = totalCodeLength(HERO_CODE);
  const visibleChars = useTypewriter(totalChars, 16, 2600);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((index) => (index + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[slideIndex];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-paper-300 bg-paper-50 shadow-[0_24px_48px_-32px_rgb(20_23_28/0.35)]">
        <WindowBar title="app/api/queue/route.ts" />
        <div className="min-h-[264px] px-5 py-5">
          <CodeText lines={HERO_CODE} visibleChars={visibleChars} />
        </div>
        <div className="flex items-center gap-2 border-t border-paper-300 bg-success-50 px-4 py-2.5 font-mono text-xs text-success-600">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Schema checked · slot added to the locked starter
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-300 bg-paper-50 shadow-[0_24px_48px_-32px_rgb(20_23_28/0.35)]">
        <WindowBar title="pitch/deck.json" />
        <div className="px-6 py-6">
          <div className="min-h-[168px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">{slide.kicker}</p>
                <h3 className="mt-3 font-display text-2xl font-medium leading-[1.2] text-ink-900">{slide.title}</h3>
                <ul className="mt-4 space-y-2">
                  {slide.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-[1.5] text-ink-600">
                      <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent-600" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
            {SLIDES.map((item, index) => (
              <span
                key={item.title}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === slideIndex ? 'w-8 bg-accent-600' : 'w-3 bg-paper-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WindowBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-paper-300 bg-paper-100 px-4 py-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-paper-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-paper-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-paper-300" />
      </div>
      <span className="truncate font-mono text-xs text-ink-500">{title}</span>
    </div>
  );
}
