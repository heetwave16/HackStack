// @vitest-environment jsdom

import { act, createElement, useReducer, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PreviewTab from "@/components/PreviewTab";
import { toStudioResult } from "@/lib/studio-result";
import { createWorkspaceState, workspaceReducer } from "@/lib/workspace-state";
import {
  FALLBACK_HACKSTACK_RESULT,
  type HackStackOutput,
} from "@/types/hackstack";

function workspace(): HackStackOutput {
  return {
    ...structuredClone(FALLBACK_HACKSTACK_RESULT),
    projectName: "Preview workspace",
    previewApp: {
      primaryEntityName: "Tasks",
      columns: ["name", "status"],
      sampleRows: [{ name: "Original task", status: "Pending" }],
      metrics: [{ label: "Tasks", value: "1", trend: "Original sample" }],
      quickActionLabel: "Add task",
    },
  };
}

function Harness({
  initial,
  replacement,
  onSave,
}: {
  initial: HackStackOutput;
  replacement: HackStackOutput;
  onSave: (output: HackStackOutput) => void;
}) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initial,
    createWorkspaceState,
  );
  const [showPreview, setShowPreview] = useState(true);
  const result = toStudioResult(state.output, {
    id: "workspace",
    source: "offline",
    latencyMs: null,
  });

  return createElement(
    "div",
    null,
    createElement(
      "button",
      { onClick: () => setShowPreview((visible) => !visible) },
      "Toggle preview",
    ),
    createElement(
      "button",
      {
        onClick: () =>
          dispatch({
            type: "agent-patch",
            patch: {
              pitchSlides: initial.pitchDeck.map((slide, index) => ({
                ...slide,
                title: index === 0 ? "Updated pitch" : slide.title,
              })),
            },
          }),
      },
      "Apply pitch patch",
    ),
    createElement(
      "button",
      { onClick: () => dispatch({ type: "replace", output: replacement }) },
      "Replace workspace",
    ),
    createElement(
      "button",
      { onClick: () => onSave(structuredClone(state.output)) },
      "Save",
    ),
    showPreview &&
      createElement(PreviewTab, {
        result,
        initialRowCount: state.previewBaseline.sampleRows.length,
        onChange: (preview) => dispatch({ type: "edit-preview", preview }),
        onReset: () => dispatch({ type: "reset-preview" }),
      }),
  );
}

const dialogMethods = ["showModal", "close"] as const;

describe("controlled preview workspace", () => {
  let container: HTMLDivElement;
  let root: Root;
  let initial: HackStackOutput;
  let replacement: HackStackOutput;
  let save: ReturnType<typeof vi.fn<(output: HackStackOutput) => void>>;
  let dialogDescriptors: Record<string, PropertyDescriptor | undefined>;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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
    initial = workspace();
    replacement = workspace();
    replacement.projectName = "Replacement workspace";
    replacement.previewApp.sampleRows = [
      { name: "Replacement task", status: "Completed" },
      { name: "Another replacement task", status: "Active" },
    ];
    replacement.previewApp.metrics = [
      { label: "Tasks", value: "8", trend: "Fresh sample" },
    ];
    save = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(Harness, { initial, replacement, onSave: save }),
      );
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    for (const method of dialogMethods) {
      const descriptor = dialogDescriptors[method];
      if (descriptor)
        Object.defineProperty(HTMLDialogElement.prototype, method, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
    }
    vi.unstubAllGlobals();
  });

  function button(
    label: string,
    scope: ParentNode = container,
  ): HTMLButtonElement {
    const match = Array.from(scope.querySelectorAll("button")).find(
      (node) =>
        (node.getAttribute("aria-label") ?? node.textContent?.trim()) === label,
    );
    expect(match, `button: ${label}`).toBeDefined();
    return match!;
  }

  async function click(label: string, scope: ParentNode = container) {
    await act(async () => {
      button(label, scope).click();
    });
  }

  function row(name: string): HTMLTableRowElement {
    const match = Array.from(
      container.querySelectorAll<HTMLTableRowElement>("tbody tr"),
    ).find((node) => node.querySelector("td")?.textContent === name);
    expect(match, `row: ${name}`).toBeDefined();
    return match!;
  }

  function rowNames() {
    return Array.from(
      container.querySelectorAll("tbody tr"),
      (node) => node.querySelector("td")?.textContent,
    );
  }

  function expectMetrics(value: string, trend: string) {
    expect(
      Array.from(
        container.querySelectorAll("dl dd"),
        (node) => node.textContent,
      ),
    ).toEqual([value, trend]);
  }

  async function addRow(name = "Added task") {
    await click("Add task");
    const dialog = container.querySelector("dialog")!;
    expect(dialog.open).toBe(true);
    const input = dialog.querySelector<HTMLInputElement>(
      'input[placeholder="Name"]',
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, name);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click("Insert record", dialog);
    expect(dialog.open).toBe(false);
    expect(row(name).querySelector("td:last-child span")?.textContent).toBe(
      "Pending",
    );
  }

  async function advanceAddedRow() {
    await click("Advance Status", row("Added task"));
    expect(
      row("Added task").querySelector("td:last-child span")?.textContent,
    ).toBe("Active");
  }

  function savedOutput() {
    expect(save).toHaveBeenCalled();
    return save.mock.calls[save.mock.calls.length - 1][0];
  }

  it("persists added rows, advanced status, and metrics through tab remounts, pitch patches, and Save", async () => {
    await addRow();
    expectMetrics("2", "+1 added in this session");
    await advanceAddedRow();
    expectMetrics("2", "2 records · status updated");

    await click("Toggle preview");
    expect(container.querySelector("table")).toBeNull();
    await click("Toggle preview");
    expect(rowNames()).toEqual(["Added task", "Original task"]);
    expect(
      row("Added task").querySelector("td:last-child span")?.textContent,
    ).toBe("Active");
    expectMetrics("2", "2 records · status updated");

    await click("Apply pitch patch");
    expect(rowNames()).toEqual(["Added task", "Original task"]);
    expect(
      row("Added task").querySelector("td:last-child span")?.textContent,
    ).toBe("Active");
    expectMetrics("2", "2 records · status updated");
    await click("Toggle preview");
    await click("Save");

    const saved = savedOutput();
    expect(saved.previewApp.sampleRows).toEqual([
      { name: "Added task", status: "Active" },
      ...initial.previewApp.sampleRows,
    ]);
    expect(saved.previewApp.metrics).toEqual([
      { label: "Tasks", value: "2", trend: "2 records · status updated" },
    ]);
    expect(saved.pitchDeck[0].title).toBe("Updated pitch");
    expect(initial.previewApp).toEqual(workspace().previewApp);
  });

  it("resets preview edits to the original baseline without resetting the updated pitch", async () => {
    await addRow();
    await advanceAddedRow();
    await click("Apply pitch patch");
    await click("Reset");

    expect(rowNames()).toEqual(["Original task"]);
    expectMetrics("1", "Original sample");
    await click("Save");
    expect(savedOutput().previewApp).toEqual(initial.previewApp);
    expect(savedOutput().pitchDeck[0].title).toBe("Updated pitch");
  });

  it("replaces the workspace with fresh rows, metrics, pitch, and a new reset baseline", async () => {
    await addRow();
    await advanceAddedRow();
    await click("Apply pitch patch");
    await click("Replace workspace");

    expect(container.querySelector("h2")?.textContent).toBe(
      "Replacement workspace",
    );
    expect(rowNames()).toEqual([
      "Replacement task",
      "Another replacement task",
    ]);
    expectMetrics("8", "Fresh sample");
    await click("Save");
    expect(savedOutput()).toEqual(replacement);

    await addRow("Replacement addition");
    expectMetrics("9", "+1 added in this session");
    await click("Reset");
    expect(rowNames()).toEqual([
      "Replacement task",
      "Another replacement task",
    ]);
    expectMetrics("8", "Fresh sample");
    await click("Save");
    expect(savedOutput()).toEqual(replacement);
  });
});
