'use client';

import { useState, type KeyboardEvent } from 'react';
import { AlertTriangle, Info, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { STACK_OPTIONS } from './models';
import type { Notice, NoticeTone } from './types';
import { CONTROL } from './ui';

const NOTICE_STYLE: Record<NoticeTone, string> = {
  info: 'border-line text-fg-2',
  warning: 'border-warning/40 bg-warning/10 text-fg',
  error: 'border-danger/40 bg-danger/10 text-fg',
};

const NOTICE_ICON: Record<NoticeTone, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
};

interface BriefRailProps {
  ideaText: string;
  onIdeaChange: (value: string) => void;
  stack: string;
  onStackChange: (value: string) => void;
  features: string[];
  onFeaturesChange: (value: string[]) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  notice: Notice | null;
}

export default function BriefRail({
  ideaText,
  onIdeaChange,
  stack,
  onStackChange,
  features,
  onFeaturesChange,
  isGenerating,
  onGenerate,
  notice,
}: BriefRailProps) {
  const [featureDraft, setFeatureDraft] = useState('');

  const addFeature = () => {
    const rawFeatures = featureDraft
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (rawFeatures.length === 0) return;

    const updated = [...features];
    for (const next of rawFeatures) {
      if (!updated.some((feature) => feature.toLowerCase() === next.toLowerCase())) {
        updated.push(next);
      }
    }
    if (updated.length !== features.length) {
      onFeaturesChange(updated);
    }
    setFeatureDraft('');
  };

  const handleDraftKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addFeature();
    }
  };

  const NoticeIcon = notice ? NOTICE_ICON[notice.tone] : null;

  return (
    <section aria-label="Brief" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="idea" className="eyebrow">
          01 / The brief
        </label>
        <textarea
          id="idea"
          rows={4}
          value={ideaText}
          onChange={(event) => onIdeaChange(event.target.value)}
          placeholder="Two sentences: who has the problem, and what the app does about it."
          className={`${CONTROL} h-auto resize-y rounded-lg py-3 leading-relaxed shadow-inner shadow-black/10`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="stack" className="eyebrow">
          02 / The stack
        </label>
        <select id="stack" value={stack} onChange={(event) => onStackChange(event.target.value)} className={CONTROL}>
          {STACK_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="feature-draft" className="eyebrow">
          03 / Must-have features
        </label>
        {features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Must-have features">
            {features.map((feature) => (
              <li key={feature}>
                <button
                  type="button"
                  onClick={() => onFeaturesChange(features.filter((item) => item !== feature))}
                  aria-label={`Remove ${feature}`}
                  className="group inline-flex h-7 items-center gap-1.5 rounded border border-line bg-surface-2 px-2 text-xs text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
                >
                  {feature}
                  <X className="h-3 w-3 text-fg-3 group-hover:text-fg" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            id="feature-draft"
            value={featureDraft}
            onChange={(event) => setFeatureDraft(event.target.value)}
            onKeyDown={handleDraftKey}
            placeholder="Add a feature and press Enter"
            className={`${CONTROL} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={addFeature}
            disabled={!featureDraft.trim()}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-line px-2.5 text-sm text-fg-2 transition-colors hover:border-line-strong hover:text-fg disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex h-11 items-center justify-between gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-surface-0 shadow-[0_8px_24px_rgb(45_212_191_/_0.16)] transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_10px_28px_rgb(45_212_191_/_0.24)] disabled:translate-y-0 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {isGenerating ? 'Generating' : 'Generate'}
          </span>
          <kbd className="font-mono text-xs opacity-70">Ctrl/Cmd+Enter</kbd>
        </button>

        {notice && NoticeIcon && (
          <p role="alert" className={`flex items-start gap-2 rounded border p-3 text-sm leading-relaxed ${NOTICE_STYLE[notice.tone]}`}>
            <NoticeIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{notice.text}</span>
          </p>
        )}
      </div>
    </section>
  );
}
