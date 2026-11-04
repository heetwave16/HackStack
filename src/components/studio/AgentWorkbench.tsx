'use client';

import { useMemo, useState } from 'react';
import { Check, CircleAlert, LoaderCircle, Play, RotateCcw } from 'lucide-react';
import { AGENTS, type AgentId, type AgentPatch } from '@/lib/agents';
import type { ModelOption } from './models';

type AgentStatus = 'idle' | 'running' | 'done' | 'failed';
type AgentState = { status: AgentStatus; output?: string; error?: string };

interface AgentWorkbenchProps {
  idea: string;
  model: ModelOption;
  apiKey: string;
  baseUrl?: string;
  onNotice: (text: string) => void;
  onPatch: (agent: AgentId, patch: AgentPatch) => void;
}

const ORDER: AgentId[] = ['product', 'architecture', 'ui', 'code', 'pitch', 'qa'];

export default function AgentWorkbench({ idea, model, apiKey, baseUrl, onNotice, onPatch }: AgentWorkbenchProps) {
  const [states, setStates] = useState<Record<AgentId, AgentState>>(
    () => Object.fromEntries(ORDER.map((id) => [id, { status: 'idle' }])) as Record<AgentId, AgentState>
  );
  const [running, setRunning] = useState(false);

  const context = useMemo(
    () => ORDER.map((id) => states[id].output ? `${AGENTS[id].label}:\n${states[id].output}` : '').filter(Boolean).join('\n\n'),
    [states]
  );

  async function runAgent(agent: AgentId, priorContext = context) {
    setStates((previous) => ({ ...previous, [agent]: { ...previous[agent], status: 'running', error: undefined } }));
    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          idea,
          context: priorContext,
          provider: model.provider,
          model: model.id,
          apiKey,
          baseUrl
        })
      });
      const body = await response.json() as { output?: string; patch?: AgentPatch; error?: string };
      if (!response.ok || !body.output) throw new Error(body.error ?? 'Agent returned no output');
      if (!body.patch) throw new Error('Agent returned no workspace patch');
      setStates((previous) => ({ ...previous, [agent]: { status: 'done', output: body.output } }));
      onPatch(agent, body.patch);
      return body.output;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent failed';
      setStates((previous) => ({ ...previous, [agent]: { status: 'failed', error: message } }));
      throw error;
    }
  }

  async function runAll() {
    if (running) return;
    setRunning(true);
    let accumulated = '';
    try {
      for (const agent of ORDER) {
        const output = await runAgent(agent, accumulated);
        accumulated += `${AGENTS[agent].label}:\n${output}\n\n`;
      }
      onNotice('All six specialist agents completed.');
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Agent pipeline stopped.');
    } finally {
      setRunning(false);
    }
  }

  async function retry(agent: AgentId) {
    try {
      await runAgent(agent);
      onNotice(`${AGENTS[agent].label} completed again.`);
    } catch {
      onNotice(`${AGENTS[agent].label} failed again.`);
    }
  }

  return (
    <section className="workbench-panel mt-7 p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Agent room</p>
          <h2 className="mt-2 text-xl font-semibold text-fg">Six focused passes, one coherent build</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-3">Run the specialists in dependency order. Each pass receives the previous decisions, so the final QA review sees the whole build instead of isolated prompts.</p>
        </div>
        <button type="button" onClick={() => void runAll()} disabled={running || !idea.trim() || !apiKey.trim()} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-surface-0 disabled:cursor-not-allowed disabled:opacity-40">
          {running ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {running ? 'Running pipeline' : 'Run all agents'}
        </button>
      </div>
      {!apiKey.trim() && <p className="mt-4 text-xs text-warning">Add a gateway key above before running agents.</p>}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ORDER.map((agent) => {
          const state = states[agent];
          return (
            <article key={agent} className="rounded-lg border border-line bg-surface-0/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-fg">{AGENTS[agent].label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-3">{AGENTS[agent].purpose}</p>
                </div>
                {state.status === 'running' && <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-info" />}
                {state.status === 'done' && <Check className="h-4 w-4 shrink-0 text-success" />}
                {state.status === 'failed' && <CircleAlert className="h-4 w-4 shrink-0 text-danger" />}
              </div>
              {state.output && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-fg-2">{state.output}</pre>}
              {state.error && <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-danger">{state.error}</p>}
              <button type="button" onClick={() => void retry(agent)} disabled={running || !apiKey.trim()} className="mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-3 hover:text-accent disabled:opacity-40">
                <RotateCcw className="h-3 w-3" /> {state.status === 'done' ? 'Regenerate' : 'Run agent'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
