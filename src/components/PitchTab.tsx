'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare
} from 'lucide-react';
import { HackStackOutput, PitchSlide } from '@/types/hackstack';

interface PitchTabProps {
  data: HackStackOutput;
}

export default function PitchTab({ data }: PitchTabProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides = data.pitchDeck || [];

  // Reset to first slide if data changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [data.projectName]);

  // Keyboard navigation for carousel (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a form input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // Export Pitch Deck as clean Markdown file
  const handleExportDeckMarkdown = () => {
    const md =
      `# ${data.projectName} — 10-Slide Pitch Deck\n` +
      `**Tagline**: ${data.tagline}\n` +
      `**Framework**: CoNSTruct 2026 AI Hackathon Pitch Model\n\n` +
      `---\n\n` +
      slides
        .map(
          (slide) =>
            `## Slide ${slide.slideNumber}: ${slide.title}\n` +
            `### ${slide.headline}\n\n` +
            `**Key Points:**\n` +
            slide.bullets.map((b) => `- ${b}`).join('\n') +
            `\n\n> 🎙️ **Presenter Speaker Note**: ${slide.speakerNote}\n`
        )
        .join('\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${slug}-pitch-deck.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSlide: PitchSlide = slides[currentSlideIndex] || {
    slideNumber: 1,
    title: 'Overview',
    headline: data.projectName,
    bullets: [data.tagline],
    speakerNote: 'Presenting HackStack project overview.'
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
              10-Slide CoNSTruct Pitch Deck
            </h2>
            <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
              Stage Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Narrative structure synchronized directly with your generated system architecture. Use ← / → arrow keys.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportDeckMarkdown}
            className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#10B981] font-mono px-3 py-2 bg-[#0F172A] border border-[#1E293B] hover:border-[#10B981]/40 rounded-lg transition shadow-sm"
            title="Download full 10-slide deck with speaker notes as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pitch Deck (.md)</span>
          </button>

          {/* Prev / Next controls */}
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Previous slide (ArrowLeft)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#CBD5E1] px-2 whitespace-nowrap">
              Slide <strong className="text-[#10B981]">{currentSlide.slideNumber}</strong> of {slides.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Next slide (ArrowRight)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Pitch Slide Canvas */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 sm:p-10 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
        {/* Top Slide Meta Bar */}
        <div className="flex items-center justify-between border-b border-[#1E293B]/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30 font-semibold">
              Slide {currentSlide.slideNumber}: {currentSlide.title}
            </span>
          </div>
          <span className="text-xs text-[#64748B] font-mono tracking-wider">{data.projectName}</span>
        </div>

        {/* Slide Headline */}
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] leading-snug">
          {currentSlide.headline}
        </h3>

        {/* Structured Bullets */}
        <div className="grid grid-cols-1 gap-3.5 my-2">
          {currentSlide.bullets.map((bullet, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-[#131C2E]/60 border border-[#1E293B] rounded-xl p-3.5 hover:border-[#10B981]/30 transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981] mt-2 shrink-0 shadow-sm shadow-[#10B981]" />
              <p className="text-sm sm:text-base text-[#E2E8F0] leading-relaxed font-sans">{bullet}</p>
            </div>
          ))}
        </div>

        {/* Presenter Speaker Notes Panel */}
        <div className="mt-4 pt-4 border-t border-[#1E293B] bg-[#0A0F1D]/90 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-5 sm:p-6 rounded-b-2xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#10B981] uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Presenter Speaker Notes (Stage Delivery)</span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] italic leading-relaxed font-sans pl-5">
            &ldquo;{currentSlide.speakerNote}&rdquo;
          </p>
        </div>
      </div>

      {/* 10 Slide Thumbnail Navigation Pills */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Jump to Slide:</span>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {slides.map((slide, idx) => {
            const isActive = currentSlideIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`py-2 px-1 rounded-lg border text-xs font-mono transition text-center flex flex-col items-center gap-0.5 ${
                  isActive
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold shadow-md shadow-[#10B981]/15 scale-105'
                    : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#10B981]/40'
                }`}
                title={slide.title}
              >
                <span className="text-[10px] text-[#64748B]">#{slide.slideNumber}</span>
                <span className="truncate max-w-full text-[11px]">{slide.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
