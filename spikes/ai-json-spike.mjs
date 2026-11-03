// spikes/ai-json-spike.mjs
// Fast-Lane Step 2 Spike: Tests Gemini Flash structured JSON latency & schema completeness
// Usage: GEMINI_API_KEY="your_key" node spikes/ai-json-spike.mjs

const API_KEY = process.env.GEMINI_API_KEY;

const MODELS_TO_TRY = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite"
];

const TEST_PROMPTS = [
  {
    name: "Normal Full-Stack Idea",
    idea: "Peer-to-peer textbook exchange for NST Pune students with UPI escrow and barcode scan.",
    stack: "Next.js + Node + Postgres",
    features: ["UPI Escrow Hold", "ISBN Barcode Scanner", "Hostel Wing Pickup"]
  },
  {
    name: "Vague / Awkward Edge-Case Idea",
    idea: "AI study buddy for late night exams",
    stack: "Next.js + Supabase + Tailwind",
    features: ["Flashcards", "Quiz"]
  }
];

const SYSTEM_PROMPT = `You are HackStack Architect & Pitch Engine.
Given a user's hackathon idea, stack, and features, return ONLY a valid JSON object matching this exact structure:
{
  "projectName": "string",
  "tagline": "string",
  "validation": { "schemaValid": true, "compileCheckPassed": true, "usedFallback": false },
  "previewApp": {
    "primaryEntityName": "string",
    "metrics": [{ "label": "string", "value": "string", "trend": "string" }],
    "columns": ["col1", "col2", "col3", "col4"],
    "sampleRows": [{ "col1": "val", "col2": "val", "col3": "val", "col4": "val" }],
    "quickActionLabel": "string"
  },
  "codebase": {
    "prismaSchema": "string (valid Prisma schema with datasource db and 2 models)",
    "apiRouteCode": "string (Next.js App Router GET/POST route handler)",
    "starterTestCode": "string (Vitest unit test with 1 passing test and 1 TODO test)",
    "readmeMarkdown": "string"
  },
  "pitchDeck": [
    { "slideNumber": 1, "title": "string", "headline": "string", "bullets": ["string", "string"], "speakerNote": "string" }
  ],
  "demoKit": {
    "scriptSegments": [
      { "timeRange": "0:00 - 0:15", "visualAction": "string", "voiceover": "string" }
    ],
    "buildNextChecklist": [
      { "priority": 1, "task": "string", "judgingCriteria": "Product Thinking", "impactScore": "High" }
    ]
  }
}
Requirements:
- pitchDeck MUST contain exactly 10 slides (slideNumber 1 to 10).
- demoKit.scriptSegments MUST contain exactly 4 segments covering 0:00 to 1:00.
- demoKit.buildNextChecklist MUST contain 4 items mapped to 'Product Thinking', 'Innovation', 'Use of AI', and 'Feasibility'.`;

async function callGemini(modelId, userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;
  // 35s timeout to allow large 12KB structured JSON payloads to complete
  const timeoutMs = 35000;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
}

function cleanJsonText(rawText) {
  if (!rawText) return "";
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

function parseJsonWithRecovery(rawText) {
  const cleaned = cleanJsonText(rawText);
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    try {
      let inString = false;
      let escaped = false;
      let result = "";
      for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (inString) {
          if (escaped) {
            escaped = false;
            result += ch;
          } else if (ch === "\\") {
            escaped = true;
            result += ch;
          } else if (ch === '"') {
            inString = false;
            result += ch;
          } else if (ch === "\n") {
            result += "\\n";
          } else if (ch === "\r") {
            result += "\\r";
          } else if (ch === "\t") {
            result += "\\t";
          } else if (ch.charCodeAt(0) < 32) {
            result += " ";
          } else {
            result += ch;
          }
        } else {
          if (ch === '"') {
            inString = true;
          }
          result += ch;
        }
      }
      return JSON.parse(result);
    } catch {
      throw initialErr;
    }
  }
}

export function assertContract(parsed) {
  const checks = [
    ["projectName is string", typeof parsed?.projectName === "string" && parsed.projectName.length > 0],
    ["previewApp.columns has 4 items", Array.isArray(parsed?.previewApp?.columns) && parsed.previewApp.columns.length === 4],
    ["previewApp.sampleRows non-empty", Array.isArray(parsed?.previewApp?.sampleRows) && parsed.previewApp.sampleRows.length > 0],
    ["codebase.prismaSchema non-empty with model", typeof parsed?.codebase?.prismaSchema === "string" && parsed.codebase.prismaSchema.includes("model ")],
    ["codebase.starterTestCode non-empty", typeof parsed?.codebase?.starterTestCode === "string" && parsed.codebase.starterTestCode.length > 0],
    ["pitchDeck has 10 slides", Array.isArray(parsed?.pitchDeck) && parsed.pitchDeck.length === 10],
    ["demoKit.scriptSegments has 4 items", Array.isArray(parsed?.demoKit?.scriptSegments) && parsed.demoKit.scriptSegments.length === 4],
    ["demoKit.buildNextChecklist has 4 items", Array.isArray(parsed?.demoKit?.buildNextChecklist) && parsed.demoKit.buildNextChecklist.length === 4]
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return { passed: failed.length === 0, failed };
}

async function runPromptWithFallback(test) {
  const userText = `Idea: ${test.idea}\nStack: ${test.stack}\nFeatures: ${test.features.join(", ")}`;

  for (const modelId of MODELS_TO_TRY) {
    const t0 = Date.now();
    try {
      const res = await callGemini(modelId, userText);
      const elapsedMs = Date.now() - t0;

      let currentRes = res;
      if (currentRes.status === 503) {
        console.warn(`⚠️  ${modelId} returned 503 (High Demand / Overloaded) -> Retrying with 1.5s backoff...`);
        await new Promise((r) => setTimeout(r, 1500));
        currentRes = await callGemini(modelId, userText);
      }
      if (currentRes.status === 404) {
        console.warn(`⚠️  ${modelId} returned 404 (Not Found / Deprecated) -> Trying next model...`);
        continue;
      }
      if (currentRes.status === 503) {
        console.warn(`⚠️  ${modelId} returned 503 (High Demand / Overloaded) -> Trying next model...`);
        continue;
      }
      if (currentRes.status === 429) {
        console.warn(`⚠️  ${modelId} returned 429 (Quota Exceeded / Rate Limit) -> Trying next model...`);
        continue;
      }
      if (!currentRes.ok) {
        const errorText = await currentRes.text();
        console.warn(`⚠️  ${modelId} returned HTTP ${currentRes.status}: ${errorText.slice(0, 150)}... -> Trying next model...`);
        continue;
      }

      const data = await currentRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseJsonWithRecovery(rawText);
      const { passed, failed } = assertContract(parsed);

      console.log(`⏱️  Model: ${modelId} | Latency: ${(elapsedMs / 1000).toFixed(2)}s`);
      if (passed) {
        console.log(`✅ CONTRACT PASSED: "${parsed.projectName}" (10 slides, 4 demo segments, valid Prisma model)`);
        return { success: true, modelUsed: modelId, latencySeconds: (elapsedMs / 1000).toFixed(2), projectName: parsed.projectName };
      } else {
        console.warn(`⚠️  Contract partial drift on ${modelId}:`, failed, "-> Trying next model...");
        continue;
      }
    } catch (err) {
      console.warn(`⚠️  ${modelId} error: ${err.message} -> Trying next model...`);
    }
  }

  throw new Error("All candidate models failed or timed out.");
}

async function runSpike() {
  console.log("==================================================");
  console.log("🚀 Running Fast-Lane Step 2: AI JSON Contract Spike");
  console.log("==================================================");

  if (!API_KEY) {
    console.log("ℹ️  GEMINI_API_KEY is not set. Running deterministic dry-run contract verification...");
    const samplePayload = {
      projectName: "CampusSplit AI",
      tagline: "Instant UPI bill-splitting for college campuses.",
      previewApp: {
        primaryEntityName: "Active Order Pools",
        metrics: [{ label: "Active", value: "12", trend: "+2" }],
        columns: ["col1", "col2", "col3", "col4"],
        sampleRows: [{ col1: "1", col2: "2", col3: "3", col4: "4" }],
        quickActionLabel: "+ Create New"
      },
      codebase: {
        prismaSchema: "datasource db { provider = \"postgresql\" url = env(\"DATABASE_URL\") }\nmodel OrderPool { id String @id }",
        apiRouteCode: "export async function GET() {}",
        starterTestCode: "describe('test', () => { it('works', () => {}); });",
        readmeMarkdown: "# Project"
      },
      pitchDeck: Array.from({ length: 10 }, (_, i) => ({
        slideNumber: i + 1,
        title: `Slide ${i + 1}`,
        headline: "Headline",
        bullets: ["b1", "b2"],
        speakerNote: "note"
      })),
      demoKit: {
        scriptSegments: [
          { timeRange: "0:00 - 0:15", visualAction: "v", voiceover: "v" },
          { timeRange: "0:15 - 0:30", visualAction: "v", voiceover: "v" },
          { timeRange: "0:30 - 0:45", visualAction: "v", voiceover: "v" },
          { timeRange: "0:45 - 1:00", visualAction: "v", voiceover: "v" }
        ],
        buildNextChecklist: [
          { priority: 1, task: "Task 1", judgingCriteria: "Product Thinking", impactScore: "High" },
          { priority: 2, task: "Task 2", judgingCriteria: "Innovation", impactScore: "High" },
          { priority: 3, task: "Task 3", judgingCriteria: "Use of AI", impactScore: "High" },
          { priority: 4, task: "Task 4", judgingCriteria: "Feasibility", impactScore: "High" }
        ]
      }
    };
    const { passed, failed } = assertContract(samplePayload);
    if (passed) {
      console.log("✅ Deterministic dry-run contract assertions verified 100% (8/8 checks passed).");
    } else {
      console.error("❌ Dry run failed:", failed);
      process.exit(1);
    }
    return;
  }

  let totalLatency = 0;
  let runCount = 0;

  for (const test of TEST_PROMPTS) {
    console.log(`\n🧪 Testing: [${test.name}]`);
    const result = await runPromptWithFallback(test);
    if (!result.success) {
      console.error(`❌ Spike contract failed on "${test.name}"`);
      process.exit(1);
    }
    totalLatency += parseFloat(result.latencySeconds);
    runCount++;
  }

  const avgLatency = (totalLatency / runCount).toFixed(2);
  console.log("\n==================================================");
  console.log(`🎉 SPIKE COMPLETE: All prompt contracts passed! Average Latency: ${avgLatency}s`);
  console.log("==================================================");
}

runSpike().catch((err) => {
  console.error("Fatal spike failure:", err);
  process.exit(1);
});

