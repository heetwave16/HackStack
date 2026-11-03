# HackStack Project Status (Team Blue10.1 — NST-ADYPU)
**Freeze Target**: Nov 5, 2026 at 4:00 PM IST (70h Fast Lane)  
**Live URL**: `https://hack-stack-sooty.vercel.app`  
**Current Phase**: Slice 4 Complete — Studio UI, Multi-Preset Engine & Teammate Handoff Locked. Heet-1 takeover pass (Aryan + Parv slices built, tab redesigns pushed) awaiting compile verification (see Section 6).

---

## 1. Fast-Lane 5-Step Execution Tracker

| Step | Focus | Owner | Status | Artifact / Proof |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Scope, Rules & Plan Lock | All | ✅ Complete | `PLAN.md`, `GEMINI.md`, `README.md` committed |
| **Step 2** | AI JSON Contract Spike | Heet / All | ✅ Complete | `spikes/ai-json-spike.mjs` passed 8/8 assertions with fallback across Gemini models (avg 20.75s) |
| **Step 3** | Walking Skeleton & Shared Contract | Heet | ✅ Complete | `src/types/hackstack.ts`, `STATUS.md`, `src/app/layout.tsx`, `src/app/page.tsx` |
| **Step 4** | Parallel Slice Execution | Aryan / Parv / Heet | 🚀 Active | **Slice 4 (Heet)**: ✅ Complete.<br/>**Heet-1 (Heet)**: 🛠️ Studio pass plus tab redesigns on `heet-1`, see Section 6. Not compiled.<br/>**Slice 2 (Aryan)**: 🛠️ Built on `heet-1` (commit `986c9ea`), not compiled.<br/>**Slice 3 (Parv)**: 🛠️ Built on `heet-1` (commit `9f5dc0d`), not compiled. |
| **Step 5** | Integration, Polish & Freeze | All | ⏳ Queued | End-to-end rehearsal on Vercel preview |

---

## 2. Slice Breakdown & Ownership

### Slice 1: Walking Skeleton & Rules Setup
- **Owner**: Heet
- **Files Owned**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/types/hackstack.ts`, `STATUS.md`, `docs/journey.md`
- **Status**: ✅ Complete.
- **Acceptance Criteria**:
  - `PLAN.md`, `GEMINI.md`, `STATUS.md`, and `src/types/hackstack.ts` exist and compile.
  - Next.js renders `#090D16` obsidian dark mode with `#10B981` emerald accents and `#F8FAFC` text defaults.
  - 4 tabs switch cleanly with zero errors using `FALLBACK_HACKSTACK_RESULT`.
  - `npm run lint` and `npx tsc --noEmit` pass with zero errors.
  - Mobile (375px) and Desktop (1280px) responsive layout without horizontal overflow.

### Slice 2: BYOK AI Engine, Prompts & 10-Prompt Evaluation Set
- **Owner**: Aryan
- **Files Owned**: `src/app/api/generate/route.ts`, `src/lib/prompts.ts`, `src/lib/eval-prompts.json`
- **Status**: 🛠️ Built on `heet-1` (commit `986c9ea`) during the takeover pass. Not compiled or run against a live model.

### Slice 3: Golden Template, Validator & 1-Click ZIP Eject
- **Owner**: Parv
- **Files Owned**: `src/templates/*`, `src/lib/validator.ts`, `src/lib/packager.ts`
- **Status**: 🛠️ Built on `heet-1` (commits `986c9ea` for the validator and `9f5dc0d` for the template and packager). `CodeTab` now calls `downloadHackStackZip`. Not compiled.

### Slice 4: Interactive Live Preview, 10-Slide Deck & 60s Demo Kit
- **Owner**: Heet
- **Files Owned**: `src/components/*`, `src/app/page.tsx`
- **Status**: ✅ Complete.
- **Acceptance Criteria**:
  - `src/components/PreviewTab.tsx`: Renders 3 metrics with `#10B981` trend badges, live search filter with row counter, column-agnostic responsive table, and dynamic modal dialog for `quickActionLabel` that prepends new rows and increments the active metric counter in local state.
  - `src/components/CodeTab.tsx`: Renders top bar with Zod and Vitest validation badges, interactive 5-file explorer (`prisma/schema.prisma`, `src/app/api/main/route.ts`, `tests/starter.test.ts`, `README.md`, `.env.example`), copy button with 2s copied state, and 1-Click Eject (`.zip`) generating `<slug>-hackstack.zip` containing all code files + `PITCH_DECK.md`. Includes `[PARV SLICE 3 PLUG-IN]` anchor.
  - `src/components/PitchTab.tsx`: Renders 10-slide CoNSTruct pitch carousel with slide number pills (1..10), prev/next controls, arrow keyboard navigation (`←`/`→`), bold headlines, bullet cards, bottom speaker notes panel, and "Export Pitch Deck (.md)" download.
  - `src/components/DemoTab.tsx`: Renders 4-part 60s teleprompter script, browser-native screen recorder (`navigator.mediaDevices.getDisplayMedia`) with 60s countdown timer, active segment highlighting, error banner boundary, and `.webm` video download. Includes ranked CoNSTruct "Build Next" rubric checklist with interactive checkboxes, 4 criteria filter pills, and live Judge Readiness Score bar.
  - `src/app/page.tsx`: Modularized and wired to all 4 components. Features 1-click built-in preset selector for 3 complete, rich projects (`CampusSplit AI`, `TextSwap NST`, `MedDrone Dispatch`), and animated 4-stage terminal progress stepper on "Generate HackStack Studio" calling `POST /api/generate` with smooth client fallback.
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with 0 errors.

---

## 3. Riskiest Assumption Spike Record
- **Spike File**: `spikes/ai-json-spike.mjs`
- **Test Executed**: Tested structured JSON output against normal hackathon idea ("Peer-to-peer textbook exchange with UPI escrow") and edge-case idea ("AI study buddy for late night exams").
- **Fallback Verification**: Model rotation tested across `gemini-3.8-flash` -> `gemini-3.7-flash` -> `gemini-3.5-flash` -> `gemini-2.5-flash`. Automated handler caught HTTP 429 quota exhaustion on 3.8/3.7, resolved bad control characters via relaxed JSON recovery, and successfully executed on `gemini-3.5-flash`.
- **Verdict**: **PASSED** (8/8 assertions passed). Average latency: 20.75s (22.48s normal, 19.02s edge-case). Timeout hardened to 35s and contract drift fallback verified.

---

## 4. Verification & Health Record
- `node spikes/ai-json-spike.mjs`: ✅ PASS (8/8 contract checks verified; dry-run mode verified)
- `npx tsc --noEmit`: ✅ PASS (0 errors)
- `npm run lint`: ✅ PASS (0 warnings, 0 errors)
- `npm run build`: ✅ PASS (4/4 static pages generated cleanly in Next.js 15.5)
- Boundaries: ✅ PASS (zero files in `src/app/api/generate`, `src/lib`, or `src/templates`)
- **Note**: The entries above were recorded before the `heet-1` takeover commits. They do not cover the current `heet-1` tree. See Section 6.

---

## 5. Teammate Integration Guide (What Heet Built & Where Aryan + Parv Plug In)

This guide specifies the exact contracts, signatures, and insertion points so Aryan (Slice 2) and Parv (Slice 3) can work completely in parallel without file collisions or interface mismatches.

### A. For Aryan (Slice 2: BYOK AI Engine, Prompts & 10-Prompt Evaluation Set)
1. **Files to create**:
   - `src/app/api/generate/route.ts`
   - `src/lib/prompts.ts`
   - `src/lib/eval-prompts.json`
2. **Request Contract**:
   `POST /api/generate` will receive a JSON payload conforming to `HackStackInput`:
   ```ts
   interface HackStackInput {
     idea: string;
     stack: string;
     features: string[];
     modelConfig?: {
       provider: 'gemini' | 'openai-compatible';
       modelId: string;
       apiKey: string;
       baseUrl?: string;
     };
   }
   ```
3. **Response Contract**:
   Must return HTTP 200 with JSON matching `HackStackOutput` defined in `src/types/hackstack.ts`:
   - `projectName`: string
   - `tagline`: string
   - `validation`: `{ schemaValid: boolean; compileCheckPassed: boolean; usedFallback: boolean; modelUsed?: string; }`
   - `previewApp`: `{ primaryEntityName: string; metrics: PreviewMetric[]; columns: string[]; sampleRows: Record<string, string>[]; quickActionLabel: string; }`
   - `codebase`: `{ prismaSchema: string; apiRouteCode: string; starterTestCode: string; readmeMarkdown: string; }`
   - `pitchDeck`: `PitchSlide[]` (10 items)
   - `demoKit`: `{ scriptSegments: DemoScriptSegment[]; buildNextChecklist: BuildNextItem[]; }`
4. **Frontend Plug-In Point**:
   In `src/app/page.tsx`, `handleGenerate` executes:
   ```ts
   // [ARYAN SLICE 2 PLUG-IN]: Calls POST /api/generate returning HackStackOutput JSON
   const response = await fetch('/api/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
   });
   ```
   When your route returns HTTP 200 with `HackStackOutput`, the studio automatically renders your live generated data across all 4 tabs with zero frontend adjustments needed!

---

### B. For Parv (Slice 3: Golden Template, Validator & 1-Click ZIP Eject)
1. **Files to create**:
   - `src/templates/golden-template.ts` (or `src/templates/*`)
   - `src/lib/validator.ts`
   - `src/lib/packager.ts`
2. **Packager Interface (`src/lib/packager.ts`)**:
   Implement and export:
   ```ts
   import { HackStackOutput } from '@/types/hackstack';

   export async function downloadHackStackZip(data: HackStackOutput): Promise<void> {
     // Bundle golden template Next.js repo with injected prisma, api route, vitest test, readme, and pitch deck
   }
   ```
3. **Frontend Plug-In Point in `src/components/CodeTab.tsx`**:
   `CodeTab` now imports `downloadHackStackZip` from `@/lib/packager` and calls it from the eject button. The inline zip builder has been removed.
4. **Validator Interface (`src/lib/validator.ts`)**:
   Export a Zod-backed validator:
   ```ts
   import { HackStackOutput } from '@/types/hackstack';

   export function validateHackStackOutput(data: unknown): { success: boolean; data?: HackStackOutput; errors?: string[] }
   ```
   Aryan's `POST /api/generate` route will call this validator before returning data to the frontend.

---

## 6. Heet-1 Changes (branch `heet-1`)
- **Studio shell**: Restyled header, model picker with BYOK key and optional custom endpoint, numbered intake rail, and a single emerald accent. Uses the existing `#090D16` / `#10B981` / `#F8FAFC` tokens.
- **Architecture graph** (`src/components/NodeGraph.tsx`): Brief, Router, Schema and API, Live preview, Deck, and Demo nodes. Clicking a node opens its tab.
- **Shortcuts and sharing**: Ctrl/Cmd+Enter generates. Header shows the last run's latency and whether it came from the live model, an offline build, or a preset. The URL carries `?preset=<id>` for matching presets, and a button copies the studio link.
- **Model list**: Gemini 3.1 Flash-Lite, 3.5 Flash, 3.8 Flash, GPT-4o mini, and a custom OpenAI-compatible endpoint. If the live call fails, the studio shows the reason and falls back to an offline build.
- **Offline synthesizer** (`src/components/offline-synth.ts`): Builds a complete output (schema, routes, tests, README, 10 slides, demo script, checklist) client-side for custom ideas. Matching preset ideas reuse the preset's output.
- **Takeover commits on `heet-1`**:
  - `986c9ea`: Aryan's slice (`/api/generate` route, prompts, eval set, validator).
  - `9f5dc0d`: Parv's slice (golden template, packager, CodeTab wiring).
  - `3ed8741`: PitchTab redesign.
  - `e082499`: PreviewTab redesign.
  - `7674280`: DemoTab redesign, checklist double-toggle fix, timeout moved out of state update.
  - `349be5a`: CodeTab badges flattened, glow shadows removed, unverified "Compile Check Passed" and "Validated Syntax" claims removed.
- **Known issues**:
  - Custom OpenAI-compatible option sends the placeholder model id `openai-compatible`, which the route rejects with HTTP 400. The user must enter a real model id.
  - Metric counter fix and status-regex change are untested in a browser.
  - Screen recording and ZIP download are untested in a browser.
- **Verification**: Not run for this pass. `npx tsc --noEmit`, `npm run lint`, and `npm run build` were not run on the `heet-1` tree, and the environment used for this pass cannot compile the HackStack repo. Run all three locally before merging.
