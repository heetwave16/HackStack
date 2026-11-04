'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react';
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

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable);
}

const NAV_BUTTON =
  'flex items-center gap-1.5 rounded border border-line bg-surface-1 px-3 py-2 text-sm text-fg-2 transition-colors hover:border-line-strong hover:text-fg disabled:opacity-40 disabled:hover:border-line disabled:hover:text-fg-2';

export default function PitchTab({ data }: PitchTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const slides = data.pitchDeck;
  const lastIndex = Math.max(0, slides.length - 1);

  async function toggleFullscreen() {
    const canvas = canvasRef.current;
    if (!canvas || typeof document.fullscreenEnabled === 'undefined' || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement === canvas) {
        await document.exitFullscreen();
      } else {
        await canvas.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    setCurrentIndex(0);
  }, [data.projectName]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === canvasRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowLeft') setCurrentIndex((prev) => Math.max(0, prev - 1));
      if (event.key === 'ArrowRight') setCurrentIndex((prev) => Math.min(lastIndex, prev + 1));
      if (event.key === 'f' || event.key === 'F') void toggleFullscreen();
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
    return <p className="text-sm text-fg-3">No slides yet. Generate a studio to build the deck.</p>;
  }

  const slideNumber = String(current.slideNumber).padStart(2, '0');
  const totalSlides = String(slides.length).padStart(2, '0');

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Pitch deck</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">Ten slides, in order</h2>
          <p className="mt-1 text-sm text-fg-3">Arrow keys move between slides. Press F for fullscreen.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex shrink-0 items-center gap-2 self-start rounded border border-line bg-surface-1 px-3 py-2 font-mono text-xs text-fg-2 transition-colors hover:border-accent/50 hover:text-fg sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export deck (.md)
        </button>
      </div>

      <div
        ref={canvasRef}
        className={`relative flex w-full flex-col overflow-hidden border border-line bg-surface-1 ${
          isFullscreen ? 'h-full justify-center p-12' : 'aspect-video rounded-lg p-6 sm:p-10'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
          <span className="font-mono text-xs text-accent">
            {slideNumber} / {totalSlides}
          </span>
          <span className="truncate text-right font-mono text-xs uppercase tracking-wider text-fg-3">{current.title}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 py-4">
          <h3 className="text-xl font-semibold leading-tight tracking-tight text-fg">{current.headline}</h3>
          <ul className="flex flex-col gap-2.5">
            {current.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-accent">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-base leading-relaxed text-fg-2">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
          <p className="min-w-0 truncate text-sm text-fg-3">
            <span className="font-mono text-xs uppercase tracking-wider text-fg-3">Say: </span>
            {current.speakerNote}
          </p>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="shrink-0 rounded border border-line p-1.5 text-fg-3 transition-colors hover:border-line-strong hover:text-fg"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className={NAV_BUTTON}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.min(lastIndex, prev + 1))}
          disabled={currentIndex === lastIndex}
          className={NAV_BUTTON}
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
              className={`flex min-h-[3.25rem] flex-col items-start gap-1 rounded border px-3 py-2 text-left transition-colors ${
                isActive ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface-1 hover:border-line-strong'
              }`}
            >
              <span className={`font-mono text-xs ${isActive ? 'text-accent' : 'text-fg-3'}`}>
                {String(slide.slideNumber).padStart(2, '0')}
              </span>
              <span className={`line-clamp-2 text-xs leading-snug ${isActive ? 'text-fg' : 'text-fg-2'}`}>{slide.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
