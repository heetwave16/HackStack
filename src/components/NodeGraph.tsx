import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Boxes, Cpu, FileText, Layers, Presentation, Video } from 'lucide-react';
import { HackStackOutput } from '@/types/hackstack';

export type StudioTab = 'preview' | 'code' | 'pitch' | 'demo';

interface NodeGraphProps {
  data: HackStackOutput;
  activeTab: StudioTab;
  modelLabel: string;
  onSelect: (tab: StudioTab) => void;
}

interface GraphNodeProps {
  icon: LucideIcon;
  kicker: string;
  title: string;
  detail: string;
  tab?: StudioTab;
  activeTab: StudioTab;
  onSelect: (tab: StudioTab) => void;
}

const NODE_BASE = 'flex min-w-0 flex-1 flex-col gap-1 rounded-lg border px-3.5 py-3 text-left md:min-w-[11rem]';

function GraphNode({ icon: Icon, kicker, title, detail, tab, activeTab, onSelect }: GraphNodeProps) {
  const isActive = tab !== undefined && tab === activeTab;
  const tone = isActive ? 'border-[#10B981]/60 bg-[#10B981]/10' : 'border-[#1E293B] bg-[#0F172A]';
  const content = (
    <>
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#64748B]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {kicker}
      </span>
      <span className="text-sm font-semibold text-[#F8FAFC]">{title}</span>
      <span className="truncate text-xs text-[#94A3B8]">{detail}</span>
    </>
  );

  if (tab === undefined) {
    return <div className={`${NODE_BASE} ${tone}`}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      aria-current={isActive ? 'true' : undefined}
      className={`${NODE_BASE} ${tone} transition-colors hover:border-[#10B981]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]`}
    >
      {content}
    </button>
  );
}

function FlowArrow() {
  return <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#334155] md:block" aria-hidden="true" />;
}

export default function NodeGraph({ data, activeTab, modelLabel, onSelect }: NodeGraphProps) {
  const entities = Array.from(data.codebase.prismaSchema.matchAll(/^model\s+(\w+)/gm), (match) => match[1]);
  const schemaDetail = entities.length > 0 ? entities.join(' / ') : 'No models found';

  return (
    <section
      aria-label="Architecture graph"
      className="workbench-panel overflow-hidden p-4 sm:p-5"
      style={{ backgroundImage: 'radial-gradient(rgb(67 79 96 / 0.32) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
    >
      <div className="flex flex-col gap-3">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="eyebrow text-accent">Your build map</p>
            <p className="mt-1 text-xs text-[#94A3B8]">A single brief, four useful outputs.</p>
          </div>
          <span className="hidden rounded-full border border-line bg-surface-0/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-fg-3 sm:inline-flex">Draft workspace</span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          <GraphNode icon={FileText} kicker="Brief" title="Idea" detail={data.projectName} activeTab={activeTab} onSelect={onSelect} />
          <FlowArrow />
          <GraphNode icon={Cpu} kicker="Router" title="Model" detail={modelLabel} activeTab={activeTab} onSelect={onSelect} />
          <FlowArrow />
          <GraphNode icon={Boxes} kicker="Lane 1 - code" title="Schema and API" detail={schemaDetail} tab="code" activeTab={activeTab} onSelect={onSelect} />
          <FlowArrow />
          <GraphNode icon={Layers} kicker="Lane 1 - app" title="Live preview" detail={data.previewApp.primaryEntityName} tab="preview" activeTab={activeTab} onSelect={onSelect} />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          <GraphNode icon={Presentation} kicker="Lane 2 - story" title="10-slide deck" detail={`${data.pitchDeck.length} slides with notes`} tab="pitch" activeTab={activeTab} onSelect={onSelect} />
          <FlowArrow />
          <GraphNode icon={Video} kicker="Lane 2 - story" title="60s demo and rubric" detail={`${data.demoKit.buildNextChecklist.length} ranked tasks`} tab="demo" activeTab={activeTab} onSelect={onSelect} />
        </div>
      </div>
    </section>
  );
}
