'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { HackStackOutput, PitchSlide } from '@/types/hackstack';
import { buildProjectSlug } from '@/lib/packager';

interface PitchTabProps {
  data: HackStackOutput;
}

function buildDeckMarkdown(data: HackStackOutput): string {
  const body = data.pitchDeck
    .map(
      (slide) =>
        `## Slide ${slide.slideNumber}: ${slide.title}\n` +
        `### ${slide.headline}\n\n` +
        slide.bullets.map((bullet) => `- ${bullet}`).join('\n') +
        `\n\n> Presenter note: ${slide.speakerNote}\n`
    )
    .join('\n---\n\n');
  return `# ${data.projectName} - 10-Slide Pitch Deck\n**Tagline:** ${data.tagline}\n\n---\n\n${body}`;
}

export default function PitchTab({ data }: PitchTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = data.pitchDeck;
  const lastIndex = Math.max(0, slides.length - 1);

  useEffect(() => {
    setCurrentIndex(0);
  }, [data.projectName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'ArrowLeft') setCurrentIndex((prev) => Math.max(0, prev - 1));
      if (event.key === 'ArrowRight') setCurrentIndex((prev) => Math.min(lastIndex, prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastIndex]);

  const handleExport = () => {
    const blob = new Blob([buildDeckMarkdown(data)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${buildProjectSlug(data.projectName)}-pitch-deck.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const current: PitchSlide | undefined = slides[currentIndex];
  if (!current) {
    return <p className="text-sm text-[#94A3B8]">No slides yet. Generate a studio to build the deck.</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-[#1E293B] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#10B981]">Pitch deck</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#F8FAFC] sm:text-2xl">Ten slides, in order</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Use the left and right arrow keys to move between slides.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex shrink-0 items-center gap-2 self-start rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 font-mono text-xs text-[#CBD5E1] transition-colors hover:border-[#10B981]/50 hover:text-[#F8FAFC] sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export deck (.md)
        </button>
      </div>

      <article className="flex flex-col gap-6 rounded-xl border border-[#1E293B] bg-[#0D1322] p-6 sm:p-10">
        <header className="flex items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
          <span className="font-mono text-xs text-[#10B981]">
            {String(current.slideNumber).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          <span className="truncate text-right text-xs uppercase tracking-[0.12em] text-[#64748B]">{current.title}</span>
        </header>

        <h3 className="text-2xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-3xl">{current.headline}</h3>

        <ul className="flex flex-col divide-y divide-[#1E293B] border-y border-[#1E293B]">
          {current.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-4 py-3.5">
              <span className="mt-0.5 font-mono text-xs text-[#10B981]">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-sm leading-relaxed text-[#E2E8F0] sm:text-base">{bullet}</span>
            </li>
          ))}
        </ul>

        <blockquote className="border-l-2 border-[#10B981] pl-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Speaker note</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#CBD5E1]">{current.speakerNote}</p>
        </blockquote>
      </article>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#CBD5E1] transition-colors hover:border-[#334155] hover:text-[#F8FAFC] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.min(lastIndex, prev + 1))}
          disabled={currentIndex === lastIndex}
          className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#CBD5E1] transition-colors hover:border-[#334155] hover:text-[#F8FAFC] disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Jump to slide" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={slide.slideNumber}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-current={isActive ? 'step' : undefined}
              title={`${slide.slideNumber}. ${slide.title}`}
              className={`flex min-h-[3.25rem] flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'border-[#10B981]/60 bg-[#10B981]/10'
                  : 'border-[#1E293B] bg-[#0F172A] hover:border-[#334155]'
              }`}
            >
              <span className={`font-mono text-[10px] ${isActive ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
                {String(slide.slideNumber).padStart(2, '0')}
              </span>
              <span className={`line-clamp-2 text-xs leading-snug ${isActive ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                {slide.title}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
