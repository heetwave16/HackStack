import { Copy, Eye, EyeOff, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { MODEL_OPTIONS, type ModelId } from './models';
import { CONTROL } from './ui';
import AuthPanel from './AuthPanel';
import type { User } from '@supabase/supabase-js';

export type StatusTone = 'running' | 'live' | 'offline' | 'preset';
export interface StatusChip {
  tone: StatusTone;
  text: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  running: 'border-info/40 text-info',
  live: 'border-success/40 text-success',
  offline: 'border-warning/40 text-warning',
  preset: 'border-line text-fg-2',
};

interface StudioHeaderProps {
  railOpen: boolean;
  onToggleRail: () => void;
  modelId: ModelId;
  onModelChange: (id: ModelId) => void;
  isCustomModel: boolean;
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  showKey: boolean;
  onToggleShowKey: () => void;
  status: StatusChip;
  linkCopied: boolean;
  onCopyLink: () => void;
  onUserChange: (user: User | null) => void;
}

export default function StudioHeader({
  railOpen,
  onToggleRail,
  modelId,
  onModelChange,
  isCustomModel,
  baseUrl,
  onBaseUrlChange,
  apiKey,
  onApiKeyChange,
  showKey,
  onToggleShowKey,
  status,
  linkCopied,
  onCopyLink,
  onUserChange,
}: StudioHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-surface-0/90 px-4 py-3 backdrop-blur-xl lg:h-16 lg:flex-nowrap lg:py-0">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleRail}
          aria-expanded={railOpen}
          aria-controls="studio-brief"
          aria-label={railOpen ? 'Hide brief panel' : 'Show brief panel'}
          className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line text-fg-3 transition-colors hover:border-line-strong hover:text-fg"
        >
          {railOpen ? <PanelLeftClose className="h-4 w-4" aria-hidden="true" /> : <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="flex min-w-0 items-center gap-3 leading-tight">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-fg">HackStack <span className="font-normal text-fg-3">/ Studio</span></div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">Build a sharp first version</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Model"
          value={modelId}
          onChange={(event) => onModelChange(event.target.value as ModelId)}
          className={`${CONTROL} max-w-[190px]`}
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {isCustomModel && (
          <input
            type="url"
            aria-label="Base URL for custom endpoint"
            placeholder="https://your-endpoint/v1"
            value={baseUrl}
            onChange={(event) => onBaseUrlChange(event.target.value)}
            className={`${CONTROL} w-52`}
          />
        )}

        <div className="flex items-center gap-1">
          <input
            type={showKey ? 'text' : 'password'}
            aria-label="API key (optional, stays in this browser tab)"
            placeholder="API key (optional)"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            className={`${CONTROL} w-40 font-mono text-xs`}
          />
          <button
            type="button"
            onClick={onToggleShowKey}
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            className="grid h-8 w-8 place-items-center rounded border border-line text-fg-3 transition-colors hover:border-line-strong hover:text-fg"
          >
            {showKey ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
          <AuthPanel onUserChange={onUserChange} />
        </div>

        <span
          role="status"
          aria-live="polite"
          className={`inline-flex h-7 max-w-[260px] items-center truncate rounded border px-2 font-mono text-xs ${TONE_CLASS[status.tone]}`}
        >
          <span className="truncate">{status.text}</span>
        </span>

        <button
          type="button"
          onClick={onCopyLink}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium text-fg-2 transition-colors hover:border-line-strong hover:bg-surface-1 hover:text-fg"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {linkCopied ? 'Link copied' : 'Share link'}
        </button>
      </div>
    </header>
  );
}
