"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Code2, Monitor, Presentation, Video } from "lucide-react";
import {
  FALLBACK_HACKSTACK_RESULT,
  HackStackOutput,
  ModelConfig,
} from "@/types/hackstack";
import { BUILT_IN_PRESETS, type HackStackPreset } from "@/components/presets";
import { synthesizeCustomHackStack } from "@/components/offline-synth";

import PreviewTab from "@/components/PreviewTab";
import CodeTab from "@/components/CodeTab";
import PitchTab from "@/components/PitchTab";
import DemoTab from "@/components/DemoTab";
import StudioHeader, {
  type StatusChip,
} from "@/components/studio/StudioHeader";
import BriefRail from "@/components/studio/BriefRail";
import RunLog from "@/components/studio/RunLog";
import PipelineStrip from "@/components/studio/PipelineStrip";
import WorkspaceTabs, {
  type WorkspaceTab,
} from "@/components/studio/WorkspaceTabs";
import WorkspaceSkeleton from "@/components/studio/WorkspaceSkeleton";
import {
  DEFAULT_MODEL_ID,
  MODEL_OPTIONS,
  type ModelId,
  type ModelOption,
} from "@/components/studio/models";
import {
  GenerationError,
  describeFailure,
  readApiError,
} from "@/components/studio/describe-failure";
import { formatDuration } from "@/components/studio/format";
import type {
  Notice,
  PipelineStage,
  ResultSource,
  RunStep,
  StageStatus,
  StudioTab,
} from "@/components/studio/types";
import { toStudioResult } from "@/lib/studio-result";
import { validateHackStackOutput } from "@/lib/validator";
import type { User } from "@supabase/supabase-js";
import ProjectPanel from "@/components/studio/ProjectPanel";
import { supabaseBrowser } from "@/lib/supabase-browser";
import AgentWorkbench from "@/components/studio/AgentWorkbench";
import { AGENTS, type AgentId, type AgentPatch } from "@/lib/agents";
import {
  createWorkspaceState,
  workspaceReducer,
  type PreviewEdit,
} from "@/lib/workspace-state";

const CODE_FILE_COUNT = 5;

function splitFeatures(value: string): string[] {
  return value
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function isHackStackOutput(value: unknown): value is HackStackOutput {
  return validateHackStackOutput(value).success;
}

export default function HackStackStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("preview");
  const [workspace, dispatchWorkspace] = useReducer(
    workspaceReducer,
    FALLBACK_HACKSTACK_RESULT,
    createWorkspaceState,
  );
  const data = workspace.output;
  const setData = useCallback(
    (output: HackStackOutput) => dispatchWorkspace({ type: "replace", output }),
    [],
  );
  const handlePreviewChange = useCallback(
    (preview: PreviewEdit) =>
      dispatchWorkspace({ type: "edit-preview", preview }),
    [],
  );
  const handlePreviewReset = useCallback(
    () => dispatchWorkspace({ type: "reset-preview" }),
    [],
  );
  const [resultSource, setResultSource] = useState<ResultSource>("offline");
  const [resultModelLabel, setResultModelLabel] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [runLog, setRunLog] = useState<RunStep[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [railOpen, setRailOpen] = useState(true);

  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
  const [apiKey, setApiKey] = useState("");

  const [showKey, setShowKey] = useState(false);
  const [availableModels, setAvailableModels] =
    useState<ModelOption[]>(MODEL_OPTIONS);

  const [ideaText, setIdeaText] = useState("");
  const [stackSelection, setStackSelection] = useState("Next.js + Node + Postgres");
  const [features, setFeatures] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const selectedModelOption =
    availableModels.find((option) => option.id === selectedModel) ??
    availableModels[0];

  useEffect(() => {
    if (!apiKey.trim() || selectedModelOption?.provider !== "openrouter")
      return;
    const controller = new AbortController();
    void fetch("/api/ai/models", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          models?: { id: string; name: string; free?: boolean }[];
        };
        const discovered = (body.models ?? []).slice(0, 80).map((model) => ({
          id: model.id,
          label: `${model.name}${model.free ? " · free" : ""}`,
          provider: "openrouter" as const,
        }));
        if (discovered.length > 0)
          setAvailableModels([
            ...MODEL_OPTIONS.slice(0, 1),
            ...discovered,
            ...MODEL_OPTIONS.slice(1),
          ]);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [apiKey, selectedModelOption?.provider]);

  const activePreset = useMemo(
    () => BUILT_IN_PRESETS.find((p) => p.name === data.projectName),
    [data.projectName],
  );

  const applyPreset = useCallback((preset: HackStackPreset) => {
    setIdeaText(preset.ideaText);
    setStackSelection(preset.stack);
    setFeatures(
      preset.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    );
    setData(preset.output);
    setProjectId(null);
    setResultSource("preset");
    setResultModelLabel(preset.output.validation.modelUsed);
    setNotice(null);
    setRunLog([
      { id: "brief", label: `Preset loaded: ${preset.name}`, status: "done" },
      { id: "model", label: "Golden sample verified", status: "done" },
      { id: "check", label: "Schema validated", status: "done" },
    ]);
  }, [setData]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    const idea = ideaText.trim();
    if (!idea) {
      setNotice({
        tone: "error",
        text: "Describe your idea before generating. Two sentences work best.",
      });
      return;
    }

    if (!apiKey.trim()) {
      setNotice({
        tone: "error",
        text: "Enter your provider API key above to use AI. Your current work is unchanged; examples do not require a key.",
      });
      return;
    }

    const modelConfig: ModelConfig = {
      provider: selectedModelOption.provider,
      modelId: selectedModelOption.id,
      apiKey: apiKey.trim(),
    };

    const startedAt = performance.now();
    setIsGenerating(true);
    setNotice(null);
    setRunLog([
      {
        id: "brief",
        label: `Brief read: ${features.length} must-have features`,
        status: "done",
      },
      {
        id: "model",
        label: `Sent to ${selectedModelOption.label}`,
        status: "running",
      },
    ]);
    const patchStep = (id: string, patch: Partial<RunStep>) =>
      setRunLog((previous) =>
        previous.map((step) => (step.id === id ? { ...step, ...patch } : step)),
      );

    try {
      const requestStartedAt = performance.now();
      const { data: sessionData } = supabaseBrowser
        ? await supabaseBrowser.auth.getSession()
        : { data: { session: null } };
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          idea,
          stack: stackSelection,
          features,
          modelConfig,
        }),
      });
      if (!response.ok) {
        throw new GenerationError(
          response.status,
          await readApiError(response),
        );
      }
      const json: unknown = await response.json();
      const requestMs = performance.now() - requestStartedAt;
      patchStep("model", {
        label: `${selectedModelOption.label} replied`,
        status: "done",
        ms: requestMs,
      });
      if (!isHackStackOutput(json)) {
        throw new GenerationError(
          null,
          "the response did not match the expected result shape",
        );
      }
      if (json.validation.usedFallback) {
        throw new GenerationError(
          null,
          "the service returned demo content instead of a live result",
        );
      }
      setRunLog((previous) => [
        ...previous,
        { id: "check", label: "Result shape checked", status: "done" },
      ]);
      setData(json);
      setProjectId(null);
      setResultSource("live");
      setResultModelLabel(
        json.validation.modelUsed ?? selectedModelOption.label,
      );
      setLatencyMs(Math.round(performance.now() - startedAt));
      setNotice({
        tone: "info",
        text: `Generated with ${json.validation.modelUsed ?? selectedModelOption.label} in ${formatDuration(requestMs)}.`,
      });
    } catch (err) {
      const reason = describeFailure(err);
      patchStep("model", {
        label: `Live call failed: ${reason}`,
        status: "failed",
        ms: performance.now() - startedAt,
      });
      setNotice({
        tone: "error",
        text: `AI generation failed: ${reason}. Your current work has been kept. You can retry or explicitly choose an example.`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    apiKey,
    features,
    ideaText,
    isGenerating,
    selectedModelOption,
    setData,
    stackSelection,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setNotice({
        tone: "error",
        text: "Could not copy the link. Copy it from the address bar instead.",
      });
    }
  }, []);

  const statusChip: StatusChip = isGenerating
    ? { tone: "running", text: `Generating with ${selectedModelOption.label}` }
    : resultSource === "live"
      ? {
          tone: "live",
          text: `Live · ${resultModelLabel ?? selectedModelOption.label} · ${formatDuration(latencyMs ?? 0)}`,
        }
      : resultSource === "offline"
        ? { tone: "offline", text: resultModelLabel ?? "Offline build · no model answered" }
        : { tone: "preset", text: "Preset sample · no model call" };

  const studioResult = useMemo(
    () =>
      toStudioResult(data, {
        id: `studio-${data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        source:
          resultSource === "live"
            ? "live"
            : resultSource === "offline"
              ? "offline"
              : "cached",
        latencyMs,
      }),
    [data, resultSource, latencyMs],
  );

  const handleAgentPatch = useCallback(
    (agent: AgentId, patch: AgentPatch) => {
      dispatchWorkspace({ type: "agent-patch", patch });
      setResultSource("live");
      setResultModelLabel(selectedModelOption.label);
      setNotice({
        tone: "info",
        text: `${AGENTS[agent].label} updated the live workspace.`,
      });
    },
    [selectedModelOption.label],
  );

  const hasRun = runLog.length > 0;
  const downstreamStatus: StageStatus = isGenerating ? "running" : "done";
  const lastModelStep = runLog.find((step) => step.id === "model");
  const modelStatus: StageStatus = isGenerating
    ? "running"
    : lastModelStep?.status === "failed"
      ? "failed"
      : resultSource === "live" || resultSource === "offline"
        ? "done"
        : "skipped";
  const stages: PipelineStage[] = [
    {
      id: "brief",
      label: "Brief",
      status: hasRun || isGenerating ? "done" : "idle",
    },
    {
      id: "model",
      label: "Model",
      status: modelStatus,
      ms: modelStatus === "done" ? (latencyMs ?? undefined) : undefined,
    },
    {
      id: "schema",
      label: "Schema & API",
      status: downstreamStatus,
      tab: "code",
    },
    {
      id: "preview",
      label: "Preview",
      status: downstreamStatus,
      tab: "preview",
    },
    { id: "deck", label: "Deck", status: downstreamStatus, tab: "pitch" },
    { id: "demo", label: "Demo", status: downstreamStatus, tab: "demo" },
  ];

  const workspaceTabs: WorkspaceTab[] = [
    { id: "preview", label: "Preview", icon: Monitor },
    {
      id: "code",
      label: "Code",
      icon: Code2,
      badge: `${CODE_FILE_COUNT} files`,
    },
    {
      id: "pitch",
      label: "Deck",
      icon: Presentation,
      badge: `${data.pitchDeck.length}`,
    },
    { id: "demo", label: "Demo", icon: Video, badge: "60 s" },
  ];

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <StudioHeader
        railOpen={railOpen}
        onToggleRail={() => setRailOpen((open) => !open)}
        modelId={selectedModel}
        onModelChange={(id) => {
          const nextProvider = availableModels.find(
            (model) => model.id === id,
          )?.provider;
          if (nextProvider !== selectedModelOption.provider) setApiKey("");
          setSelectedModel(id);
        }}
        modelOptions={availableModels}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        showKey={showKey}
        onToggleShowKey={() => setShowKey((shown) => !shown)}
        status={statusChip}
        linkCopied={linkCopied}
        onCopyLink={handleCopyLink}
        onUserChange={setUser}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        {railOpen && (
          <aside
            id="studio-brief"
            className="flex w-full shrink-0 flex-col gap-8 border-b border-line bg-surface-1/55 p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-[320px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5"
          >
            <BriefRail
              ideaText={ideaText}
              onIdeaChange={setIdeaText}
              stack={stackSelection}
              onStackChange={setStackSelection}
              features={features}
              onFeaturesChange={setFeatures}
              isGenerating={isGenerating}
              onGenerate={() => void handleGenerate()}
              presets={BUILT_IN_PRESETS}
              activePresetName={activePreset?.name}
              onPresetSelect={applyPreset}
              notice={notice}
            />
            <RunLog steps={runLog} />
            <ProjectPanel
              user={user}
              input={{ idea: ideaText, stack: stackSelection, features }}
              output={data}
              projectId={projectId}
              onProjectSaved={setProjectId}
              onProjectLoaded={({ id, input: loadedInput, output }) => {
                setProjectId(id);
                setIdeaText(loadedInput.idea);
                setStackSelection(loadedInput.stack);
                setFeatures(loadedInput.features);
                setData(output);
                setResultSource("live");
              }}
              onNotice={(text) => setNotice({ tone: "info", text })}
            />
            <AgentWorkbench
              idea={ideaText}
              model={selectedModelOption}
              apiKey={apiKey}

              onNotice={(text) => setNotice({ tone: "info", text })}
              onPatch={handleAgentPatch}
            />
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <PipelineStrip
            stages={stages}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />

          <div className="w-full max-w-[1440px] px-4 py-6 lg:px-10 lg:py-8">
            <WorkspaceTabs
              tabs={workspaceTabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="pt-7"
            >
              {isGenerating ? (
                <WorkspaceSkeleton />
              ) : (
                <>
                  {activeTab === "preview" && (
                    <PreviewTab
                      result={studioResult}
                      initialRowCount={
                        workspace.previewBaseline.sampleRows.length
                      }
                      onChange={handlePreviewChange}
                      onReset={handlePreviewReset}
                    />
                  )}
                  {activeTab === "code" && <CodeTab data={data} />}
                  {activeTab === "pitch" && <PitchTab data={data} />}
                  {activeTab === "demo" && <DemoTab data={data} />}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
