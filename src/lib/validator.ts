import { z } from "zod";
import type { HackStackOutput } from "@/types/hackstack";

const judgingCriterion = z.enum([
  "Product Thinking",
  "Innovation",
  "Use of AI",
  "Feasibility",
]);

export const hackStackOutputSchema = z
  .object({
    projectName: z.string().min(1).max(80),
    tagline: z.string().min(1).max(240),
    validation: z.object({
      schemaValid: z.boolean(),
      compileCheckPassed: z.boolean(),
      usedFallback: z.boolean(),
      modelUsed: z.string().optional(),
      fallbackReason: z.string().max(240).optional(),
    }),
    previewApp: z.object({
      primaryEntityName: z.string().min(1).max(120),
      metrics: z
        .array(
          z.object({ label: z.string(), value: z.string(), trend: z.string() }),
        )
        .length(3),
      columns: z
        .array(z.string().regex(/^[a-z][A-Za-z0-9]*$/))
        .min(3)
        .max(6),
      sampleRows: z.array(z.record(z.string(), z.string())).min(1).max(10),
      quickActionLabel: z.string().min(1).max(80),
    }),
    codebase: z.object({
      prismaSchema: z.string().min(20),
      apiRouteCode: z.string().min(20),
      starterTestCode: z.string().min(20),
      readmeMarkdown: z.string().min(20),
      additionalFiles: z
        .array(
          z.object({
            path: z.string().min(1),
            content: z.string(),
            language: z.string().optional(),
          }),
        )
        .optional(),
    }),
    pitchDeck: z
      .array(
        z.object({
          slideNumber: z.number().int().min(1).max(10),
          title: z.string().min(1).max(60),
          headline: z.string().min(1).max(160),
          bullets: z.array(z.string().min(1)).min(1).max(4),
          speakerNote: z.string().min(1).max(400),
        }),
      )
      .length(10),
    demoKit: z.object({
      scriptSegments: z
        .array(
          z.object({
            timeRange: z.string(),
            visualAction: z.string(),
            voiceover: z.string(),
          }),
        )
        .min(4)
        .max(4),
      buildNextChecklist: z
        .array(
          z.object({
            priority: z.number().int().min(1),
            task: z.string().min(1),
            judgingCriteria: judgingCriterion,
            impactScore: z.string().min(1),
          }),
        )
        .min(4)
        .max(6),
    }),
  })
  .superRefine((value, ctx) => {
    const columns = new Set(value.previewApp.columns);
    value.previewApp.sampleRows.forEach((row, index) => {
      if (
        Object.keys(row).some((key) => !columns.has(key)) ||
        columns.size !== Object.keys(row).length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["previewApp", "sampleRows", index],
          message: "row keys must match preview columns exactly",
        });
      }
    });
    const slideNumbers = value.pitchDeck.map((slide) => slide.slideNumber);
    if (slideNumbers.some((number, index) => number !== index + 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pitchDeck"],
        message: "slides must be numbered 1 through 10 in order",
      });
    }
    const expectedTimes = [
      "0:00 - 0:15",
      "0:15 - 0:30",
      "0:30 - 0:45",
      "0:45 - 1:00",
    ];
    if (
      value.demoKit.scriptSegments
        .map((segment) => segment.timeRange)
        .join("|") !== expectedTimes.join("|")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["demoKit", "scriptSegments"],
        message: "script must contain the four required 15-second ranges",
      });
    }
    const checklist = value.demoKit.buildNextChecklist;
    const uniqueCriteria = new Set(
      checklist.map((item) => item.judgingCriteria),
    );
    if (checklist.length <= 4) {
      if (uniqueCriteria.size !== checklist.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["demoKit", "buildNextChecklist"],
          message: "checklist criteria must be distinct",
        });
      }
    } else {
      if (uniqueCriteria.size < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["demoKit", "buildNextChecklist"],
          message: "checklist must cover all four judging criteria",
        });
      }
    }
  });

export type ValidationResult =
  | { success: true; data: HackStackOutput }
  | { success: false; errors: string[] };

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  if (start < 0)
    throw new Error("Model response did not contain a JSON object");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}" && --depth === 0) {
      return text.slice(start, index + 1);
    }
  }
  throw new Error("Model response contained an incomplete JSON object");
}

function parseJsonWithControlCharacterRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    let repaired = "";
    let inString = false;
    let escaped = false;
    for (const character of text) {
      if (inString && character === "\n") repaired += "\\n";
      else if (inString && character === "\r") repaired += "\\r";
      else if (inString && character === "\t") repaired += "\\t";
      else repaired += character;
      if (character === '"' && !escaped) inString = !inString;
      escaped = character === "\\" && !escaped;
    }
    return JSON.parse(repaired);
  }
}

function toColumnKey(value: unknown, index: number): string {
  const normalized = String(value ?? "")
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, next: string | undefined) =>
      next ? next.toUpperCase() : "",
    )
    .replace(/^[^a-zA-Z]+/, "")
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
  return /^[a-z][A-Za-z0-9]*$/.test(normalized)
    ? normalized
    : `field${index + 1}`;
}

function defaultCellValue(key: string, rowIndex: number): string {
  if (/status|state/i.test(key)) return "Active";
  if (/id$/i.test(key)) return `sample-${rowIndex + 1}`;
  if (/count|number|amount|total|price|score|value/i.test(key)) return "0";
  if (/date|time|created|updated/i.test(key)) return "Today";
  if (/name|title|label/i.test(key)) return `Sample ${rowIndex + 1}`;
  return "Sample value";
}

function normalizeTimeRange(index: number, value: unknown): string {
  const expected = ["0:00 - 0:15", "0:15 - 0:30", "0:30 - 0:45", "0:45 - 1:00"];
  if (index < expected.length) return expected[index];
  const text = String(value ?? "").trim();
  const match = text.match(/(\d+)\s*[-–]\s*(\d+)\s*s?/i);
  if (match) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      const format = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      return `${format(start)} - ${format(end)}`;
    }
  }
  return expected[expected.length - 1];
}

export function normalizeAndRepairStudioOutput(text: string): unknown {
  const withoutThinking = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const withoutFences = withoutThinking
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsed = parseJsonWithControlCharacterRepair(
    extractJsonObject(withoutFences),
  );
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model response did not resolve to a JSON object");
  }

  const output = { ...(parsed as Record<string, unknown>) };
  if (output.projectName !== undefined) {
    output.projectName = String(output.projectName).slice(0, 80) || "HackStack Project";
  }
  if (output.tagline !== undefined) {
    output.tagline = String(output.tagline).slice(0, 240) || "Scaffolded with HackStack";
  }

  const previewApp = {
    ...((output.previewApp as Record<string, unknown> | undefined) ?? {}),
  };
  if (previewApp.primaryEntityName !== undefined) {
    previewApp.primaryEntityName = String(previewApp.primaryEntityName).slice(0, 120) || "Items";
  }
  if (previewApp.quickActionLabel !== undefined) {
    previewApp.quickActionLabel = String(previewApp.quickActionLabel).slice(0, 80) || "+ Add Item";
  }
  const rawColumns = Array.isArray(previewApp.columns)
    ? previewApp.columns
    : [];
  const usedColumns = new Set<string>();
  const columns = Array.from(
    { length: Math.min(Math.max(rawColumns.length, 3), 6) },
    (_, index) => {
      let column = toColumnKey(rawColumns[index] ?? `field${index + 1}`, index);
      // Advance on every collision, including collisions with generated field names.
      for (let suffix = index + 1; usedColumns.has(column); suffix += 1)
        column = `field${suffix}`;
      usedColumns.add(column);
      return column;
    },
  );
  const rawRows = Array.isArray(previewApp.sampleRows)
    ? previewApp.sampleRows
    : [{}];
  const sampleRows = rawRows.slice(0, 10).map((rawRow, rowIndex) => {
    const row =
      rawRow && typeof rawRow === "object"
        ? (rawRow as Record<string, unknown>)
        : {};
    return Object.fromEntries(
      columns.map((column) => {
        const sourceKey = Object.keys(row).find(
          (key) => key === column || toColumnKey(key, 0) === column,
        );
        const value = sourceKey ? row[sourceKey] : undefined;
        return [
          column,
          typeof value === "string" && value.trim()
            ? value
            : defaultCellValue(column, rowIndex),
        ];
      }),
    );
  });
  output.previewApp = { ...previewApp, columns, sampleRows };

  if (Array.isArray(output.pitchDeck)) {
    const slides = output.pitchDeck.slice(0, 10).map((rawSlide, index) => {
      const slide = (rawSlide && typeof rawSlide === "object" ? rawSlide : {}) as Record<string, unknown>;
      const rawBullets = Array.isArray(slide.bullets)
        ? slide.bullets.map(String).filter((b) => b.trim().length > 0)
        : [];
      const bullets = rawBullets.length > 0
        ? rawBullets.slice(0, 4).map((b) => b.slice(0, 200))
        : ["Key project highlight"];
      return {
        ...slide,
        slideNumber: index + 1,
        title: String(slide.title ?? `Slide ${index + 1}`).slice(0, 60) || `Slide ${index + 1}`,
        headline: String(slide.headline ?? "Project Overview").slice(0, 160) || "Project Overview",
        bullets,
        speakerNote: String(slide.speakerNote ?? "Presenter note.").slice(0, 400) || "Presenter note.",
      };
    });
    while (slides.length < 10) {
      const num = slides.length + 1;
      slides.push({
        slideNumber: num,
        title: `Milestone ${num}`,
        headline: `Project Milestone ${num}`,
        bullets: ["Core implementation detail"],
        speakerNote: "Walk through key architecture points.",
      });
    }
    output.pitchDeck = slides;
  }

  const demoKit =
    output.demoKit && typeof output.demoKit === "object"
      ? { ...(output.demoKit as Record<string, unknown>) }
      : undefined;
  if (demoKit) {
    if (Array.isArray(demoKit.scriptSegments)) {
      const segments: Array<{
        timeRange: string;
        visualAction: string;
        voiceover: string;
        [key: string]: unknown;
      }> = demoKit.scriptSegments
        .slice(0, 4)
        .map((segment, index) => {
          const raw = (segment && typeof segment === "object" ? segment : {}) as Record<string, unknown>;
          return {
            ...raw,
            timeRange: normalizeTimeRange(
              index,
              raw.timeRange,
            ),
            visualAction: String(raw.visualAction || "Walk through key product features and architecture.").slice(0, 200),
            voiceover: String(raw.voiceover || "Here is the key workflow for this milestone.").slice(0, 300),
          };
        });
      const expectedRanges = ["0:00 - 0:15", "0:15 - 0:30", "0:30 - 0:45", "0:45 - 1:00"];
      while (segments.length < 4) {
        const index = segments.length;
        segments.push({
          timeRange: expectedRanges[index],
          visualAction: "Walk through key product features and architecture.",
          voiceover: "Here is the key workflow for this milestone.",
        });
      }
      demoKit.scriptSegments = segments;
    }

    if (Array.isArray(demoKit.buildNextChecklist)) {
      const criteriaList: Array<"Product Thinking" | "Innovation" | "Use of AI" | "Feasibility"> = [
        "Product Thinking",
        "Innovation",
        "Use of AI",
        "Feasibility",
      ];
      const items = demoKit.buildNextChecklist.slice(0, 6).map((rawItem, index) => {
        const item = (rawItem && typeof rawItem === "object" ? rawItem : {}) as Record<string, unknown>;
        const rawCriteria = String(item.judgingCriteria ?? "");
        const judgingCriteria = criteriaList.includes(rawCriteria as typeof criteriaList[number])
          ? rawCriteria
          : criteriaList[index % criteriaList.length];
        return {
          ...item,
          priority: typeof item.priority === "number" && item.priority > 0 ? Math.floor(item.priority) : index + 1,
          task: String(item.task ?? `Priority task ${index + 1}`).slice(0, 200) || `Priority task ${index + 1}`,
          judgingCriteria,
          impactScore: String(item.impactScore ?? "High").slice(0, 50) || "High",
        };
      });
      while (items.length < 4) {
        const index = items.length;
        const criterion = criteriaList[index];
        items.push({
          priority: index + 1,
          task: `Expand test and implementation coverage for ${criterion}`,
          judgingCriteria: criterion,
          impactScore: "High",
        });
      }
      // Ensure all 4 criteria are present if length >= 4
      const presentCriteria = new Set(items.map((it) => it.judgingCriteria));
      for (const [missingIndex, criterion] of criteriaList.entries()) {
        if (!presentCriteria.has(criterion)) {
          // Replace an item that has a duplicate criterion
          const duplicateIndex = items.findIndex((it, idx) =>
            items.some((other, oIdx) => oIdx !== idx && other.judgingCriteria === it.judgingCriteria),
          );
          if (duplicateIndex >= 0) {
            items[duplicateIndex].judgingCriteria = criterion;
            presentCriteria.add(criterion);
          } else if (items.length > missingIndex) {
            items[missingIndex].judgingCriteria = criterion;
            presentCriteria.add(criterion);
          }
        }
      }
      demoKit.buildNextChecklist = items;
    }

    output.demoKit = demoKit;
  }

  return output;
}

export function validateHackStackOutput(data: unknown): ValidationResult {
  const parsed = hackStackOutputSchema.safeParse(data);
  if (parsed.success)
    return { success: true, data: parsed.data as HackStackOutput };
  return {
    success: false,
    errors: parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
    ),
  };
}

export function passesGeneratedCodeChecks(data: unknown): boolean {
  if (!hackStackOutputSchema.safeParse(data).success) return false;
  const output = data as HackStackOutput;
  return (
    /datasource\s+db[\s\S]*provider\s*=\s*"postgresql"/i.test(
      output.codebase.prismaSchema,
    ) &&
    /\bmodel\s+\w+/i.test(output.codebase.prismaSchema) &&
    /NextResponse/.test(output.codebase.apiRouteCode) &&
    /export\s+async\s+function\s+GET\b/.test(output.codebase.apiRouteCode) &&
    /export\s+async\s+function\s+POST\b/.test(output.codebase.apiRouteCode) &&
    /from\s+['"]vitest['"][\s\S]*describe[\s\S]*expect/.test(
      output.codebase.starterTestCode,
    )
  );
}
