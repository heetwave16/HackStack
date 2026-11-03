export type StudioTab = 'preview' | 'code' | 'pitch' | 'demo';
export type ResultSource = 'preset' | 'live' | 'offline';
export type StepStatus = 'running' | 'done' | 'failed';

export interface RunStep {
  id: string;
  label: string;
  status: StepStatus;
  ms?: number;
}

export type StageId = 'brief' | 'model' | 'schema' | 'preview' | 'deck' | 'demo';
export type StageStatus = 'idle' | 'running' | 'done' | 'failed' | 'skipped';

export interface PipelineStage {
  id: StageId;
  label: string;
  status: StageStatus;
  ms?: number;
  tab?: StudioTab;
}

export type NoticeTone = 'info' | 'warning' | 'error';
export interface Notice {
  tone: NoticeTone;
  text: string;
}
