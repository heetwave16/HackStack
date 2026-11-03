'use client';

import { useRef, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { StudioTab } from './types';

export interface WorkspaceTab {
  id: StudioTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface WorkspaceTabsProps {
  tabs: WorkspaceTab[];
  activeTab: StudioTab;
  onChange: (tab: StudioTab) => void;
}

export default function WorkspaceTabs({ tabs, activeTab, onChange }: WorkspaceTabsProps) {
  const buttonRefs = useRef<Partial<Record<StudioTab, HTMLButtonElement | null>>>({});

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? last : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = last;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = tabs[nextIndex];
    onChange(next.id);
    buttonRefs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" aria-label="Studio outputs" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              buttonRefs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors ${
              isActive ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg-2'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
            {tab.badge && (
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs tabular-nums text-fg-2">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
