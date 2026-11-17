import { describe, expect, it } from "vitest";
import {
  normalizeAndRepairStudioOutput,
  passesGeneratedCodeChecks,
  validateHackStackOutput,
} from "@/lib/validator";
import { FALLBACK_HACKSTACK_RESULT } from "@/types/hackstack";

describe("normalizeAndRepairStudioOutput", () => {
  it.each([
    ["field2", "field2", "status"],
    ["field2", "field2", "field3"],
    ["field2", "field2", "field2", "field2", "field2", "field2"],
    ["name", "name", "field2", "field3", "field4", "field5"],
    ["!", "?", null],
  ])("repairs colliding columns with bounded progress: %j", (...columns) => {
    const output = normalizeAndRepairStudioOutput(
      JSON.stringify({
        previewApp: {
          columns,
          sampleRows: [{ field2: "Preserved value", status: "Active" }],
        },
      }),
    ) as {
      previewApp: { columns: string[]; sampleRows: Record<string, string>[] };
    };
    expect(output.previewApp.columns).toHaveLength(columns.length);
    expect(new Set(output.previewApp.columns).size).toBe(columns.length);
    expect(
      output.previewApp.columns.every((column) =>
        /^[a-z][A-Za-z0-9]*$/.test(column),
      ),
    ).toBe(true);
    expect(Object.keys(output.previewApp.sampleRows[0])).toEqual(
      output.previewApp.columns,
    );
    if (columns[0] === "field2")
      expect(output.previewApp.sampleRows[0].field2).toBe("Preserved value");
  });

  it("repairs reasoning wrappers, fences, slide numbers, demo ranges, and row keys", () => {
    const repaired = normalizeAndRepairStudioOutput(`
      <think>planning hidden from the user</think>
      \`\`\`json
      {
        "projectName": "Test",
        "tagline": "A test project",
        "previewApp": {
          "columns": ["name", "status", "amount"],
          "sampleRows": [{"name": "Row 1"}]
        },
        "pitchDeck": ${JSON.stringify(Array.from({ length: 10 }, (_, index) => ({ slideNumber: 99 - index })))},
        "demoKit": {
          "scriptSegments": [
            {"timeRange": "0-15s"},
            {"timeRange": "15-30s"},
            {"timeRange": "30-45s"},
            {"timeRange": "45-60s"}
          ]
        }
      }
      \`\`\`
    `);

    const output = repaired as {
      previewApp: { sampleRows: Record<string, string>[] };
      pitchDeck: { slideNumber: number }[];
      demoKit: { scriptSegments: { timeRange: string }[] };
    };
    expect(Object.keys(output.previewApp.sampleRows[0])).toEqual([
      "name",
      "status",
      "amount",
    ]);
    expect(output.pitchDeck.map((slide) => slide.slideNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(
      output.demoKit.scriptSegments.map((segment) => segment.timeRange),
    ).toEqual(["0:00 - 0:15", "0:15 - 0:30", "0:30 - 0:45", "0:45 - 1:00"]);
  });

  it("produces a schema-valid output after the repair boundary", () => {
    const repaired = normalizeAndRepairStudioOutput(
      JSON.stringify({
        projectName: "Test",
        tagline: "A test project",
        validation: {
          schemaValid: true,
          compileCheckPassed: false,
          usedFallback: false,
        },
        previewApp: {
          primaryEntityName: "Items",
          metrics: [
            { label: "A", value: "1", trend: "Up" },
            { label: "B", value: "2", trend: "Up" },
            { label: "C", value: "3", trend: "Up" },
          ],
          columns: ["name", "status", "amount"],
          sampleRows: [{ name: "One" }],
          quickActionLabel: "+ Add item",
        },
        codebase: {
          prismaSchema: "x".repeat(20),
          apiRouteCode: "x".repeat(20),
          starterTestCode: "x".repeat(20),
          readmeMarkdown: "x".repeat(20),
        },
        pitchDeck: Array.from({ length: 10 }, (_, index) => ({
          slideNumber: index + 10,
          title: "T",
          headline: "H",
          bullets: ["B"],
          speakerNote: "N",
        })),
        demoKit: {
          scriptSegments: Array.from({ length: 4 }, () => ({
            timeRange: "0-15s",
            visualAction: "A",
            voiceover: "V",
          })),
          buildNextChecklist: [
            {
              priority: 1,
              task: "A",
              judgingCriteria: "Product Thinking",
              impactScore: "High",
            },
            {
              priority: 2,
              task: "B",
              judgingCriteria: "Innovation",
              impactScore: "High",
            },
            {
              priority: 3,
              task: "C",
              judgingCriteria: "Use of AI",
              impactScore: "High",
            },
            {
              priority: 4,
              task: "D",
              judgingCriteria: "Feasibility",
              impactScore: "High",
            },
          ],
        },
      }),
    );

    expect(validateHackStackOutput(repaired).success).toBe(true);
  });

  it("validates checklists with 5 and 6 items covering all 4 judging criteria", () => {
    const base = structuredClone(FALLBACK_HACKSTACK_RESULT);

    // 5-item checklist with one repeated criterion
    base.demoKit.buildNextChecklist = [
      { priority: 1, task: "Task 1", judgingCriteria: "Product Thinking", impactScore: "High" },
      { priority: 2, task: "Task 2", judgingCriteria: "Innovation", impactScore: "High" },
      { priority: 3, task: "Task 3", judgingCriteria: "Use of AI", impactScore: "High" },
      { priority: 4, task: "Task 4", judgingCriteria: "Feasibility", impactScore: "High" },
      { priority: 5, task: "Task 5", judgingCriteria: "Product Thinking", impactScore: "Medium" },
    ];
    expect(validateHackStackOutput(base).success).toBe(true);

    // 6-item checklist with two repeated criteria
    base.demoKit.buildNextChecklist.push({
      priority: 6,
      task: "Task 6",
      judgingCriteria: "Innovation",
      impactScore: "Low",
    });
    expect(validateHackStackOutput(base).success).toBe(true);
  });

  it("passesGeneratedCodeChecks accepts GET and POST in any order", () => {
    const output = structuredClone(FALLBACK_HACKSTACK_RESULT);

    // Standard order (GET before POST)
    expect(passesGeneratedCodeChecks(output)).toBe(true);

    // Reversed order (POST before GET)
    output.codebase.apiRouteCode = `
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ status: 'ok' }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ items: [] });
}
    `.trim();
    expect(passesGeneratedCodeChecks(output)).toBe(true);

    // Missing POST should fail
    output.codebase.apiRouteCode = `
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({}); }
    `.trim();
    expect(passesGeneratedCodeChecks(output)).toBe(false);
  });

  it("clamps overlong strings and pads missing slides and demo segments", () => {
    const repaired = normalizeAndRepairStudioOutput(
      JSON.stringify({
        projectName: "A".repeat(120),
        tagline: "B".repeat(300),
        pitchDeck: [
          { slideNumber: 1, title: "Title 1", headline: "Headline 1", bullets: ["b1", "b2", "b3", "b4", "b5"], speakerNote: "Note 1" },
        ],
        demoKit: {
          scriptSegments: [
            { timeRange: "0-15s", visualAction: "Action", voiceover: "Voice" },
          ],
        },
      }),
    ) as {
      projectName: string;
      tagline: string;
      pitchDeck: Array<{ slideNumber: number; bullets: string[] }>;
      demoKit: { scriptSegments: Array<{ timeRange: string }> };
    };

    expect(repaired.projectName.length).toBeLessThanOrEqual(80);
    expect(repaired.tagline.length).toBeLessThanOrEqual(240);
    expect(repaired.pitchDeck).toHaveLength(10);
    expect(repaired.pitchDeck[0].bullets.length).toBeLessThanOrEqual(4);
    expect(repaired.demoKit.scriptSegments).toHaveLength(4);
  });
});
