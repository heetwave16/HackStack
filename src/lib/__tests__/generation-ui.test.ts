// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HackStackStudioPage from "../../app/page";
import type ProjectPanel from "../../components/studio/ProjectPanel";
import { BUILT_IN_PRESETS } from "../../components/presets";
import * as offlineSynth from "../../components/offline-synth";
import { validateHackStackOutput } from "../validator";
import {
  FALLBACK_HACKSTACK_RESULT,
  type HackStackInput,
  type HackStackOutput,
} from "../../types/hackstack";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn<typeof fetch>(),
  generate: vi.fn<() => Response | Promise<Response>>(),
  models: vi.fn<() => Response | Promise<Response>>(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase-browser", () => ({
  supabaseBrowser: { auth: { getSession: mocks.getSession } },
}));
vi.mock("@/components/studio/AuthPanel", () => ({ default: () => null }));
vi.mock("@/components/studio/AgentWorkbench", () => ({ default: () => null }));
vi.mock("@/components/CodeTab", () => ({ default: () => null }));
vi.mock("@/components/PitchTab", () => ({ default: () => null }));
vi.mock("@/components/DemoTab", () => ({ default: () => null }));

// Observe the page's persistence boundary without any Supabase queries.
vi.mock("@/components/studio/ProjectPanel", () => ({
  default: function ProjectPanelProbe({
    output,
    projectId,
    onProjectLoaded,
  }: ComponentProps<typeof ProjectPanel>) {
    return createElement(
      "section",
      null,
      createElement(
        "button",
        {
          onClick: () =>
            onProjectLoaded({
              id: "saved-project",
              input: savedInput(),
              output: project("Saved workspace"),
            }),
        },
        "Load saved project",
      ),
      createElement(
        "output",
        { "aria-label": "Workspace snapshot" },
        JSON.stringify(output),
      ),
      createElement(
        "output",
        { "aria-label": "Save target" },
        projectId ?? "new project",
      ),
    );
  },
}));

function savedInput(): HackStackInput {
  return {
    idea: "A shared task tracker for a hackathon team. Track owners and task status.",
    stack: "Next.js + Node + Postgres",
    features: ["Shared tasks", "Status updates"],
  };
}

function project(name: string): HackStackOutput {
  const output = structuredClone(FALLBACK_HACKSTACK_RESULT);
  output.projectName = name;
  output.tagline = `${name}: shared tasks for a team.`;
  output.validation = {
    schemaValid: true,
    compileCheckPassed: true,
    usedFallback: false,
    modelUsed: "test-model",
  };
  output.previewApp = {
    primaryEntityName: "Tasks",
    columns: ["name", "owner", "status"],
    sampleRows: [{ name: `${name} task`, owner: "Ada", status: "Pending" }],
    metrics: [
      { label: "Tasks", value: "1", trend: `${name} baseline` },
      { label: "Owners", value: "1", trend: "One teammate" },
      { label: "Completed", value: "0", trend: "Not started" },
    ],
    quickActionLabel: "Add task",
  };
  output.codebase.readmeMarkdown = `# ${name}\nProject-specific build instructions for the task tracker.`;
  output.pitchDeck[0].headline = `${name} pitch`;
  output.demoKit.scriptSegments[0].visualAction = `${name} demo`;
  return output;
}

function httpFailure(status: number, error: string, reason = error) {
  return {
    label: `HTTP ${status}`,
    respond: () => Response.json({ error }, { status }),
    reason,
  };
}

const failures = [
  httpFailure(401, "Check your provider API key."),
  httpFailure(
    400,
    "This model is unavailable.",
    "the request was rejected (This model is unavailable.)",
  ),
  httpFailure(
    429,
    "Quota exceeded.",
    "the provider quota or rate limit is used up",
  ),
  httpFailure(502, "The provider returned an invalid response."),
  httpFailure(504, "The provider timed out. Retry the request."),
  {
    label: "a network rejection",
    respond: () => Promise.reject(new TypeError("Failed to fetch")),
    reason: "the network connection failed",
  },
  {
    label: "a successful HTTP response with a bad shape",
    respond: () =>
      Response.json({ projectName: "Incomplete generated project" }),
    reason: "the response did not match the expected result shape",
  },
  {
    label: "a legacy usedFallback response",
    respond: () => {
      const legacy = project("Legacy demo");
      legacy.validation.usedFallback = true;
      legacy.validation.fallbackReason = "Provider unavailable";
      // Ensure this exercises usedFallback rejection, not shape rejection.
      expect(validateHackStackOutput(legacy).success).toBe(true);
      return Response.json(legacy);
    },
    reason: "the service returned demo content instead of a live result",
  },
];

const KEY_INPUT = 'input[aria-label="Provider API key (required for AI)"]';
const dialogMethods = ["showModal", "close"] as const;

describe("page generation preserves the current workspace on failure", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalUrl: string;
  let dialogDescriptors: Record<string, PropertyDescriptor | undefined>;

  beforeEach(async () => {
    vi.resetAllMocks();
    // Presets are constructed at import time; only generation-time synthesis is forbidden.
    vi.spyOn(offlineSynth, "synthesizeCustomHackStack");
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.models.mockImplementation(() =>
      Response.json({
        models: [
          { id: "test/free", name: "Discovered test model", free: true },
        ],
      }),
    );
    mocks.generate.mockImplementation(() => {
      throw new Error("Unexpected generation request");
    });
    mocks.fetch.mockImplementation(async (url) => {
      if (url === "/api/ai/models") return mocks.models();
      if (url === "/api/generate") return mocks.generate();
      throw new Error(`Unexpected fetch: ${String(url)}`);
    });

    originalUrl = window.location.href;
    window.history.replaceState(null, "", "/");
    dialogDescriptors = Object.fromEntries(
      dialogMethods.map((method) => [
        method,
        Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, method),
      ]),
    );
    for (const method of dialogMethods) {
      Object.defineProperty(HTMLDialogElement.prototype, method, {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.open = method === "showModal";
        },
      });
    }

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(HackStackStudioPage));
    });
    await click("Load saved project");
    expect(snapshot()).toEqual(project("Saved workspace"));
    expect(saveTarget()).toBe("saved-project");
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    window.history.replaceState(null, "", originalUrl);
    for (const method of dialogMethods) {
      const descriptor = dialogDescriptors[method];
      if (descriptor)
        Object.defineProperty(HTMLDialogElement.prototype, method, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function button(
    label: string | RegExp,
    scope: ParentNode = container,
  ): HTMLButtonElement {
    const match = Array.from(scope.querySelectorAll("button")).find((node) => {
      const name =
        node.getAttribute("aria-label") ?? node.textContent?.trim() ?? "";
      return typeof label === "string" ? name === label : label.test(name);
    });
    expect(match, `button: ${label}`).toBeDefined();
    return match!;
  }

  async function click(label: string | RegExp, scope: ParentNode = container) {
    await act(async () => {
      button(label, scope).click();
    });
  }

  async function type(selector: string, value: string) {
    const input = container.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(selector);
    expect(input, selector).not.toBeNull();
    const prototype =
      input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
        input,
        value,
      );
      input!.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  async function selectModel(value: string) {
    const select = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Model"]',
    )!;
    expect(Array.from(select.options, (option) => option.value)).toContain(
      value,
    );
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(select.value).toBe(value);
  }

  function snapshot(): HackStackOutput {
    return JSON.parse(
      container.querySelector('[aria-label="Workspace snapshot"]')!
        .textContent!,
    );
  }

  function saveTarget() {
    return container.querySelector('[aria-label="Save target"]')!.textContent;
  }

  function previewHtml() {
    return container.querySelector('[role="tabpanel"]')!.innerHTML;
  }

  function requests(path: string) {
    return mocks.fetch.mock.calls.filter(([url]) => url === path);
  }

  async function editPreview() {
    const original = snapshot();
    await click("Add task");
    expect(container.querySelector("dialog")!.open).toBe(true);
    await type('dialog input[placeholder="Name"]', "My edited task");
    await click("Insert record", container.querySelector("dialog")!);
    const addedRow = container.querySelector<HTMLTableRowElement>("tbody tr")!;
    expect(addedRow.querySelector("td")!.textContent).toBe("My edited task");
    await click("Advance Status", addedRow);
    const edited = snapshot();
    expect(edited).toEqual({
      ...original,
      previewApp: {
        ...original.previewApp,
        sampleRows: [
          { name: "My edited task", owner: "-", status: "Active" },
          ...original.previewApp.sampleRows,
        ],
        metrics: original.previewApp.metrics.map((metric, index) =>
          index === 0
            ? {
                ...metric,
                value: String(Number(metric.value) + 1),
                trend: `${original.previewApp.sampleRows.length + 1} records · status updated`,
              }
            : metric,
        ),
      },
    });
    return edited;
  }

  it.each([
    ["missing", ""],
    ["whitespace-only", "   "],
  ])(
    "rejects a %s entered key locally without changing Preview or its reset baseline",
    async (_label, key) => {
      const edited = await editPreview();
      const html = previewHtml();
      await type(KEY_INPUT, key);
      await click(/^Generate/);

      const alert = container.querySelector('[role="alert"]')!.textContent!;
      expect(alert).toContain("Enter your provider API key");
      expect(alert).toContain("examples do not require a key");
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(offlineSynth.synthesizeCustomHackStack).not.toHaveBeenCalled();
      expect(snapshot()).toEqual(edited);
      expect(previewHtml()).toBe(html);
      expect(saveTarget()).toBe("saved-project");
      await click("Reset");
      expect(snapshot()).toEqual(project("Saved workspace"));
    },
  );

  it.each(failures)(
    "keeps edited Preview, all workspace data, the reset baseline and saved target after $label",
    async ({ respond, reason }) => {
      const edited = await editPreview();
      const html = previewHtml();
      await type(KEY_INPUT, "test-openrouter-key");
      mocks.generate.mockImplementationOnce(respond);
      await click(/^Generate/);

      expect(requests("/api/ai/models")).toHaveLength(1);
      expect(requests("/api/generate")).toHaveLength(1);
      expect(mocks.generate).toHaveBeenCalledTimes(1);
      const alert = container.querySelector('[role="alert"]')!.textContent!;
      expect(alert).toContain(`AI generation failed: ${reason}`);
      expect(alert).toContain("Your current work has been kept");
      expect(alert).toContain("retry or explicitly choose an example");
      expect(snapshot()).toEqual(edited);
      expect(previewHtml()).toBe(html);
      expect(saveTarget()).toBe("saved-project");
      expect(offlineSynth.synthesizeCustomHackStack).not.toHaveBeenCalled();

      await click("Reset");
      expect(snapshot()).toEqual(project("Saved workspace"));
      expect(saveTarget()).toBe("saved-project");
    },
  );

  it("replaces data and the reset baseline on live success, detaching the previous save target", async () => {
    await editPreview();
    const generated = project("Generated workspace");
    generated.previewApp.sampleRows.push({
      name: "Another generated task",
      owner: "Grace",
      status: "Pending",
    });
    generated.previewApp.metrics[0] = {
      label: "Tasks",
      value: "2",
      trend: "Fresh generated sample",
    };
    expect(validateHackStackOutput(generated).success).toBe(true);
    mocks.generate.mockImplementationOnce(() => Response.json(generated));
    await type(KEY_INPUT, "  test-openrouter-key  ");
    await click(/^Generate/);

    expect(snapshot()).toEqual(generated);
    expect(saveTarget()).toBe("new project");
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(
      "Generated with test-model",
    );
    expect(
      container.querySelector('header [role="status"]')!.textContent,
    ).toContain("Live · test-model");
    expect(
      Array.from(
        container.querySelectorAll("tbody tr td:first-child"),
        (node) => node.textContent,
      ),
    ).toEqual(generated.previewApp.sampleRows.map((row) => row.name));
    const [, init] = requests("/api/generate")[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init!.body as string)).toEqual({
      ...savedInput(),
      modelConfig: {
        provider: "openrouter",
        modelId: "openrouter/free",
        apiKey: "test-openrouter-key",
      },
    });
    expect(offlineSynth.synthesizeCustomHackStack).not.toHaveBeenCalled();

    await editPreview();
    await click("Reset");
    expect(snapshot()).toEqual(generated);
    expect(saveTarget()).toBe("new project");
  });

  it("loads an explicit example without a key or request and detaches the previous save target", async () => {
    await editPreview();
    const example = BUILT_IN_PRESETS[1];
    await click(/^TextSwap NST/);

    expect(snapshot()).toEqual(example.output);
    expect(saveTarget()).toBe("new project");
    expect(container.querySelector<HTMLTextAreaElement>("#idea")!.value).toBe(
      example.ideaText,
    );
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(
      container.querySelector('header [role="status"]')!.textContent,
    ).toContain("Preset sample");
    await click("Reset");
    expect(snapshot()).toEqual(example.output);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(offlineSynth.synthesizeCustomHackStack).not.toHaveBeenCalled();
  });

  it("keeps a same-provider key, clears it when switching providers, and sends OpenAI gpt-4o-mini without a custom URL", async () => {
    await type(KEY_INPUT, "test-openrouter-key");
    expect(requests("/api/ai/models")).toHaveLength(1);
    expect(requests("/api/ai/models")[0][1]?.headers).toBeUndefined();
    expect(JSON.stringify(requests("/api/ai/models"))).not.toContain(
      "test-openrouter-key",
    );
    await selectModel("test/free");
    expect(container.querySelector<HTMLInputElement>(KEY_INPUT)!.value).toBe(
      "test-openrouter-key",
    );

    await selectModel("gpt-4o-mini");
    expect(container.querySelector<HTMLInputElement>(KEY_INPUT)!.value).toBe(
      "",
    );
    expect(
      container.querySelector('option[value="gpt-4o-mini"]')!.textContent,
    ).toContain("OpenAI gpt-4o-mini");
    // Inspect the real header, not a mock of its former custom-endpoint control.
    expect(container.querySelectorAll("header input")).toHaveLength(1);
    await click(/^Generate/);
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(
      "Enter your provider API key",
    );
    expect(requests("/api/generate")).toHaveLength(0);

    await type(KEY_INPUT, "  test-openai-key  ");
    expect(requests("/api/ai/models")).toHaveLength(1);
    mocks.generate.mockImplementationOnce(() =>
      Response.json(project("OpenAI workspace")),
    );
    await click(/^Generate/);
    expect(requests("/api/generate")).toHaveLength(1);
    expect(
      JSON.parse(requests("/api/generate")[0][1]!.body as string).modelConfig,
    ).toEqual({
      provider: "openai-compatible",
      modelId: "gpt-4o-mini",
      apiKey: "test-openai-key",
    });
    expect(snapshot()).toEqual(project("OpenAI workspace"));
    await selectModel("openrouter/free");
    expect(container.querySelector<HTMLInputElement>(KEY_INPUT)!.value).toBe(
      "",
    );
    expect(requests("/api/ai/models")).toHaveLength(1);
  });
});
