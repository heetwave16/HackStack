Execute Fast-Lane Step 2 (Spike the riskiest thing) and Fast-Lane Step 3 (Skeleton & Deploy — Slice 1) for HackStack (Team Blue10.1 — NST-ADYPU) as a hackathon showcase.

Working directory: /Users/heet/Documents/HackStack/HackStack
Integrity mode: development

## Requirements

### R1. Fast-Lane Step 2: AI JSON Contract Spike
Implement and execute the spike script `spikes/ai-json-spike.mjs` testing normal full-stack and edge-case ideas with latency and contract verification (projectName, 4 columns, sampleRows, prismaSchema, starterTestCode, 10 pitch slides, 4 demo segments, 4 checklist items). Handle model fallbacks gracefully (`gemini-3.5-flash` and `gemini-3.7-flash` as reliable endpoints, accommodating `gemini-2.5-flash` 404s and `gemini-3.8-flash` 503s), and update `PLAN.md` with the spike verdict.

### R2. Fast-Lane Step 3: Shared Data Contract & Tracking Artifacts
Create and verify `src/types/hackstack.ts` locking the shared data contract (`ModelConfig`, `HackStackInput`, `HackStackOutput`, `FALLBACK_HACKSTACK_RESULT`). Create `STATUS.md` for tracking milestones, decisions, and known issues, and `docs/journey.md` for journey tracking.

### R3. Fast-Lane Step 3: Slice 1 UI Skeleton & Layout
Install required dependencies (`lucide-react`, `jszip`, `zod`). Update `src/app/layout.tsx` to load Inter and JetBrains Mono fonts from `next/font/google`, apply `#090D16` background and `#F8FAFC` text defaults, and set metadata for "HackStack — AI Hackathon Launchpad (Team Blue10.1)". Build the minimal walking skeleton in `src/app/page.tsx` using `FALLBACK_HACKSTACK_RESULT` displaying studio header, BYOK selector shell, intake shell, and 4 tab buttons switching cleanly.

### R4. Scope Boundaries & Constraints
Do NOT create or edit Slice 2 files (`src/app/api/generate/route.ts`, `src/lib/prompts.ts`, `src/lib/eval-prompts.json`), Slice 3 files (`src/templates/*`, `src/lib/validator.ts`, `src/lib/packager.ts`), or full child tab components in `src/components/*`.

## Acceptance Criteria

### Spike & Contract
- [ ] `spikes/ai-json-spike.mjs` executes and verifies contract schema (projectName, 4 columns, sampleRows, prismaSchema, starterTestCode, 10 pitch slides, 4 demo segments, 4 checklist items) and latency, handling model fallbacks gracefully.
- [ ] `PLAN.md` is updated with the spike verdict.
- [ ] `src/types/hackstack.ts` exports `ModelConfig`, `HackStackInput`, `HackStackOutput`, and `FALLBACK_HACKSTACK_RESULT` with zero type errors.

### Walking Skeleton & Styling
- [ ] `package.json` contains `lucide-react`, `jszip`, and `zod`.
- [ ] `STATUS.md` and `docs/journey.md` exist and track initial milestones.
- [ ] `src/app/layout.tsx` loads Inter and JetBrains Mono fonts from `next/font/google`, applies `#090D16` background and `#F8FAFC` text defaults, and sets metadata for "HackStack — AI Hackathon Launchpad (Team Blue10.1)".
- [ ] `http://localhost:3000` renders developer-dark styling (`#090D16` bg, `#10B981` accent, `#F8FAFC` text, Inter + JetBrains Mono) with 4 tabs switching cleanly using `FALLBACK_HACKSTACK_RESULT`.

### Static Checks & Scope Boundaries
- [ ] `npm run lint` passes with zero errors.
- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] No files belonging to Slice 2 (`src/app/api/generate/route.ts`, `src/lib/prompts.ts`), Slice 3 (`src/templates/*`, `src/lib/validator.ts`), or child tab components in `src/components/*` are created or modified.
