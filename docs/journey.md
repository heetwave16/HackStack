# HackStack Journey & Engineering Log
**Team**: Blue10.1 (NST-ADYPU)  
**Hackathon Event**: CoNSTruct 2026 (70h Fast Lane, Freeze Nov 5 at 4:00 PM IST)

---

## 1. Context & The 70-Hour Fast Lane

Engineering students entering hackathons routinely lose the first 15–20 hours setting up boilerplate:
1. Setting up database schemas, migrations, and mock seeds.
2. Wiring repetitive Next.js App Router CRUD handlers.
3. Writing starter tests that never get implemented.
4. Panicking at 3:00 AM on Sunday trying to assemble a 10-slide deck and 60-second stage pitch.

**HackStack** solves this by turning a 2–3 sentence hackathon idea into:
- A live interactive UI dashboard preview (Tab 1).
- A schema-validated Next.js + Prisma + PostgreSQL + Vitest starter repository ready to eject as a `.zip` (Tab 2).
- An auto-generated 10-slide CoNSTruct pitch narrative (Tab 3).
- A 60-second screen-recorder walkthrough with a ranked "Build Next" rubric checklist (Tab 4).

---

## 2. Fast-Lane Step 1: Scope, Rules & Plan Lock

We established strict team discipline:
- **`GEMINI.md` Rules**: Single slice per turn, plan first, test after every edit, strict file ownership boundaries (Heet on Studio UI / Slices 1 & 4, Parv on Golden Template & Packager / Slice 3, Aryan on BYOK AI Engine & Prompts / Slice 2).
- **Design Tokens**: Obsidian dark background `#090D16`, emerald green compile accent `#10B981`, white-slate text `#F8FAFC`, monospace code fonts `JetBrains Mono`, and UI font `Inter`.
- **Zero Secrets Policy**: Never expose Gemini/OpenAI API keys in client-side bundles; validate all inputs and LLM outputs server-side with Zod.

---

## 3. Fast-Lane Step 2: AI JSON Contract Spike

Before writing UI or backend infrastructure, we tested our riskiest technical hypothesis:
> *Can Gemini Flash reliably return a 12KB+ multi-section JSON contract containing schema, API routes, tests, 10 slides, and 4 script segments in under 30 seconds without syntax failure?*

### Discoveries & Learnings:
1. **Model Fallback Routing**: In real hackathon conditions, API endpoints face quotas and transient load:
   - `gemini-3.8-flash` and `gemini-3.7-flash` may experience HTTP 429 quota exhaustion or 503 high-demand load.
   - Catching 429 and 503 errors and cascading to `gemini-3.5-flash` proved 100% resilient.
2. **Control Character Sanitization**: LLMs outputting raw code snippets in JSON strings (e.g., Prisma models, markdown READMEs) can emit unescaped literal tabs or newlines. Standard `JSON.parse` crashes with `Bad control character in string literal`. We developed a relaxed JSON parser in `spikes/ai-json-spike.mjs` that sanitizes control characters inside strings without breaking external JSON formatting.
3. **Contract Completeness**: Both normal hackathon ideas and vague edge-case ideas passed all 8 contract checks:
   - `projectName` (non-empty string)
   - `columns` (4 items)
   - `sampleRows` (valid records)
   - `prismaSchema` (valid datasource and models)
   - `starterTestCode` (Vitest test suite)
   - `pitchDeck` (exactly 10 slides)
   - `demoKit.scriptSegments` (exactly 4 segments)
   - `demoKit.buildNextChecklist` (4 ranked rubric tasks)
- **Spike Latency**: 20.75s average end-to-end (22.48s normal, 19.02s edge-case). Fallback rotation hardened with 35s timeouts and contract-drift fallback.

---

## 4. Fast-Lane Step 3: Walking Skeleton & Shared Contract

In this step, we establish the core foundations:
- **`src/types/hackstack.ts`**: The canonical data contract exporting `ModelConfig`, `HackStackInput`, `HackStackOutput`, and `FALLBACK_HACKSTACK_RESULT`.
- **`src/app/layout.tsx`**: Next.js App Router root layout configured with Google fonts `Inter` and `JetBrains_Mono`, dark mode background `#090D16`, and HackStack metadata.
- **`src/app/page.tsx`**: The walking skeleton featuring:
  - HackStack Studio header with live compile status.
  - BYOK model selector (Gemini 3.5 Flash / Gemini 3.7 Flash / Gemini 3.8 Flash).
  - Idea intake sidebar shell.
  - 4-tab view switcher (Tab 1 Live App Preview, Tab 2 Code & Schema, Tab 3 10-Slide Pitch Deck, Tab 4 60s Demo & Checklist) populated with `FALLBACK_HACKSTACK_RESULT`.

---

## 5. Upcoming Slices (Steps 4 & 5)

- **Slice 2 (Aryan)**: Server-side `/api/generate` route, Zod schema validation, BYOK model routing, and 10-prompt evaluation test suite.
- **Slice 3 (Parv)**: Golden Next.js + Postgres template injection, compilation checks, and client-side ZIP packaging via `jszip`.
- **Slice 4 (Heet)**: Interactive state on Tab 1 (+Add row), 10-slide deck navigator + Markdown exporter on Tab 3, browser screen recording on Tab 4.
