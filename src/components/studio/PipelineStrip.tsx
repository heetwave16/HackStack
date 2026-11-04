import { Check, ChevronRight, Loader2, Minus, X } from 'lucide-react';
import { formatDuration } from './format';
import type { PipelineStage, StageStatus, StudioTab } from './types';

function StageIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-info" aria-hidden="true" />;
    case 'done':
      return <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />;
    case 'failed':
      return <X className="h-3.5 w-3.5 text-danger" aria-hidden="true" />;
    case 'skipped':
      return <Minus className="h-3.5 w-3.5 text-fg-3" aria-hidden="true" />;
    case 'idle':
      return <span className="h-2 w-2 rounded-full border border-line-strong" aria-hidden="true" />;
  }
}

interface PipelineStripProps {
  stages: PipelineStage[];
  activeTab: StudioTab;
  onSelect: (tab: StudioTab) => void;
}

export default function PipelineStrip({ stages, activeTab, onSelect }: PipelineStripProps) {
  return (
    <nav aria-label="Pipeline" className="flex h-11 items-center overflow-x-auto border-b border-line bg-surface-0/40 px-4 lg:px-8">
      <ol className="flex min-w-max items-center gap-1">
        {stages.map((stage, index) => {
          const isActive = stage.tab !== undefined && stage.tab === activeTab;
          const content = (
            <>
              <StageIcon status={stage.status} />
              <span className="text-sm">{stage.label}</span>
              {stage.status === 'skipped' && <span className="font-mono text-xs text-fg-3">no call</span>}
              {stage.ms !== undefined && (
                <span className="font-mono text-xs tabular-nums text-fg-3">{formatDuration(stage.ms)}</span>
              )}
            </>
          );
          const itemClass = 'flex h-7 items-center gap-2 rounded-md px-2 text-xs transition-colors';
          return (
            <li key={stage.id} className="flex items-center gap-1">
              {stage.tab ? (
                <button
                  type="button"
                  onClick={() => onSelect(stage.tab as StudioTab)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`${itemClass} ${isActive ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:text-fg'}`}
                >
                  {content}
                </button>
              ) : (
                <span className={`${itemClass} text-fg-2`}>{content}</span>
              )}
              {index < stages.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-fg-3" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
