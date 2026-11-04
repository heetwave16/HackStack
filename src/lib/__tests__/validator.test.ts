import { describe, expect, it } from 'vitest';
import { normalizeAndRepairStudioOutput, validateHackStackOutput } from '@/lib/validator';

describe('normalizeAndRepairStudioOutput', () => {
  it('repairs reasoning wrappers, fences, slide numbers, demo ranges, and row keys', () => {
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
    expect(Object.keys(output.previewApp.sampleRows[0])).toEqual(['name', 'status', 'amount']);
    expect(output.pitchDeck.map((slide) => slide.slideNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(output.demoKit.scriptSegments.map((segment) => segment.timeRange)).toEqual([
      '0:00 - 0:15',
      '0:15 - 0:30',
      '0:30 - 0:45',
      '0:45 - 1:00'
    ]);
  });

  it('produces a schema-valid output after the repair boundary', () => {
    const repaired = normalizeAndRepairStudioOutput(JSON.stringify({
      projectName: 'Test',
      tagline: 'A test project',
      validation: { schemaValid: true, compileCheckPassed: false, usedFallback: false },
      previewApp: {
        primaryEntityName: 'Items',
        metrics: [{ label: 'A', value: '1', trend: 'Up' }, { label: 'B', value: '2', trend: 'Up' }, { label: 'C', value: '3', trend: 'Up' }],
        columns: ['name', 'status', 'amount'],
        sampleRows: [{ name: 'One' }],
        quickActionLabel: '+ Add item'
      },
      codebase: { prismaSchema: 'x'.repeat(20), apiRouteCode: 'x'.repeat(20), starterTestCode: 'x'.repeat(20), readmeMarkdown: 'x'.repeat(20) },
      pitchDeck: Array.from({ length: 10 }, (_, index) => ({ slideNumber: index + 10, title: 'T', headline: 'H', bullets: ['B'], speakerNote: 'N' })),
      demoKit: {
        scriptSegments: Array.from({ length: 4 }, () => ({ timeRange: '0-15s', visualAction: 'A', voiceover: 'V' })),
        buildNextChecklist: [
          { priority: 1, task: 'A', judgingCriteria: 'Product Thinking', impactScore: 'High' },
          { priority: 2, task: 'B', judgingCriteria: 'Innovation', impactScore: 'High' },
          { priority: 3, task: 'C', judgingCriteria: 'Use of AI', impactScore: 'High' },
          { priority: 4, task: 'D', judgingCriteria: 'Feasibility', impactScore: 'High' }
        ]
      }
    }));

    expect(validateHackStackOutput(repaired).success).toBe(true);
  });
});
