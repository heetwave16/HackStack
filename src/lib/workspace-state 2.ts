import type { HackStackOutput } from '@/types/hackstack';
import type { StudioResult } from '@/lib/studio-result';
import { mergeAgentPatch, type AgentPatch } from '@/lib/agents';

export type PreviewEdit = Pick<StudioResult, 'rows' | 'metrics'>;

export interface WorkspaceState {
  output: HackStackOutput;
  previewBaseline: HackStackOutput['previewApp'];
}

type WorkspaceAction =
  | { type: 'replace'; output: HackStackOutput }
  | { type: 'edit-preview'; preview: PreviewEdit }
  | { type: 'reset-preview' }
  | { type: 'agent-patch'; patch: AgentPatch };

export function createWorkspaceState(output: HackStackOutput): WorkspaceState {
  return { output, previewBaseline: output.previewApp };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'replace':
      return createWorkspaceState(action.output);
    case 'edit-preview':
      return {
        ...state,
        output: {
          ...state.output,
          previewApp: {
            ...state.output.previewApp,
            sampleRows: action.preview.rows,
            metrics: action.preview.metrics.map((metric) => ({
              label: metric.label,
              value: metric.value,
              trend: metric.delta
            }))
          }
        }
      };
    case 'reset-preview':
      return { ...state, output: { ...state.output, previewApp: state.previewBaseline } };
    case 'agent-patch':
      return {
        output: mergeAgentPatch(state.output, action.patch),
        // Patch the original sample separately so Reset never captures user edits.
        previewBaseline: action.patch.livePreview
          ? mergeAgentPatch({ ...state.output, previewApp: state.previewBaseline }, { livePreview: action.patch.livePreview }).previewApp
          : state.previewBaseline
      };
  }
}
