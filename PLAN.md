# PLAN: HackStack (fast lane, 70 hrs, freeze Nov 5 at 4:00 PM IST)
Status: draft. Items marked (you) came from the user; (proposed) need confirmation.

## One-liner
(you) For 2nd-3rd year engineering students on 2-3 person hackathon teams, HackStack turns a 2-3 sentence idea into a complete, schema-validated full-stack codebase plus an auto-generated 10-slide pitch deck and 60-second demo kit so they spend 100% of their time building the unique feature that wins.

## Judging criteria / success test
- Product Thinking (you): Eliminates the 15+ hours lost to setup and 3 AM pitch prep with a ranked "Build Next" checklist tuned to what judges reward.
- Innovation (you): Parallel code + story engine where the 10-slide pitch deck and 60s demo script are wired directly to the generated app architecture.
- Use of AI (you): Understands a 2-sentence intent and outputs structured JSON to infer the data model, API surface, UI screens, and pitch narrative—with user-configurable BYOK model routing (Gemini 3.8 Flash / Gemini 2.5 Flash / OpenAI-compatible).
- Feasibility (you): Slot-injection into battle-tested starter templates with schema validation, starter unit tests the team must make pass, and 1-click ZIP/GitHub eject (no Replit lock-in).
- Success test (proposed): A judge or student can open `hack-stack-sooty.vercel.app`, enter a 2-sentence idea + 3 features (with their own API key or default server key), and within 60 seconds click through a live interactive app preview, inspect passing starter tests, download a runnable Next.js + Postgres `.zip` repo, and flip through a 10-slide deck + 60s demo recorder.

## Demo path (the 2-3 minute story)
1. Setup & Input (you): Open `hack-stack-sooty.vercel.app`, configure the AI model/key bar (e.g., Gemini Flash), type a 2-sentence idea, pick Next.js + Node + Postgres, and list 3 must-have features.
2. Generation & Validation (you): Click Generate and watch real-time progress steps as the AI infers the schema, injects code slots, and passes schema/compile checks.
3. 4-Tab Output Proof (proposed):
   - Tab 1 (Live App Preview): Click through the generated app's interactive dashboard and add a live record.
   - Tab 2 (Code, Schema & Tests): Inspect the Prisma schema, API routes, and Vitest starter test, then click "Download Repo (.zip)".
   - Tab 3 (10-Slide Pitch Deck): Flip through the auto-generated 10-slide pitch narrative and export Markdown.
   - Tab 4 (60s Demo & Rubric Checklist): Show the timestamped 60s voiceover script, browser-native screen recorder, and ranked "Build Next" judge checklist.

## Must build / nice to have / cut
- Must (you): Idea intake form + BYOK AI model router, structured JSON generator (DB schema + API routes + UI preview + starter test + 10 slides + 60s script + Build-Next checklist), 1 Golden Next.js + Node + Postgres template with `.zip` download, and deterministic fallback templates if generation fails.
- Nice (you): 4 additional stack templates and browser-native screen recording (`getDisplayMedia`) in Tab 4.
- Cut (you): Replit dependency/lock-in, real-time multiplayer spec collaboration, and community template marketplace.

## Stack and why
- Frontend & Backend (you): Next.js (App Router) + TypeScript + Tailwind CSS — single repo, zero CORS issues, already connected to GitHub and Vercel.
- Data & Validation (you): Zod for strict server-side JSON validation; Prisma + PostgreSQL + Vitest inside the generated Golden Template; `jszip` for client-side repo packaging.
- AI Service (you): Server-side `/api/generate` route supporting Gemini Flash (`gemini-3.8-flash` / `gemini-2.5-flash`) and OpenAI-compatible BYOK endpoints, with server env key and deterministic fallback template protection.
- Hosting (you): Vercel (`hack-stack-sooty.vercel.app`) auto-deploying from `github.com/heetwave16/HackStack`.

## Look and feel
- Vibe (proposed): Sharp, terminal-fast, developer-dark.
- Colors (proposed): `#090D16` (obsidian background) and `#10B981` (emerald compile-pass accent), with `#F8FAFC` text.
- Font (proposed): `Inter` for UI + `JetBrains Mono` for code, schema, and logs.
- Reference (proposed): Linear / Vercel dark dashboard aesthetic.

## Riskiest assumption and spike verdict
- Risk (proposed): Will the LLM consistently return a single valid JSON payload containing all 4 tabs (preview schema, Prisma/API/test code, 10 slides, and 60s script) under 15 seconds without breaking the UI, and properly redirect when a user enters custom model strings like `gemini-3.8-flash`?
- Verdict (tested Nov 3): **PASSED.** Throwaway spike `spikes/ai-json-spike.mjs` executed against normal and edge-case hackathon ideas. Verified all 8 schema contract assertions (projectName, 4 columns, sampleRows, Prisma schema with models, starter test code, 10 pitch deck slides, 4 script segments, 4 rubric buildNext items). Automated fallback caught 429 quota/503 overload on `gemini-3.8-flash` and `gemini-3.7-flash` and seamlessly completed on `gemini-3.5-flash` with 100% schema compliance and an average latency of 20.75s (22.48s on normal idea, 19.02s on edge-case). Fallback hardened to continue rotation on partial contract drift with 35s model timeouts. Deterministic fallback template protection confirmed for zero-API-key mode.

## Slices (in order, each with acceptance criteria)
1. Slice 1 — Walking Skeleton & Rules Setup:
   - Criteria: `PLAN.md`, `GEMINI.md` rules file, `STATUS.md`, and `src/types/hackstack.ts` committed; `hack-stack-sooty.vercel.app` renders the dark-mode shell and 4 tabs populated with deterministic mock data; mobile (375px) and desktop (1280px) layouts pass with no horizontal scroll.
2. Slice 2 — BYOK AI Engine, Prompts & 10-Prompt Evaluation Set (Aryan):
   - Criteria: `POST /api/generate` accepts an idea, stack, features, and optional BYOK `modelConfig`; validates output with Zod; passes at least 9/10 prompts in `src/lib/eval-prompts.json` without crashing; automatically serves a golden fallback template if API key is missing or rate-limited; no API keys leaked in client bundle.
3. Slice 3 — Golden Template, Validator & 1-Click ZIP Eject (Parv):
   - Criteria: Tab 2 displays green `Schema Validated` and `Compile Check Passed` badges, renders generated Prisma schema, API route, and Vitest starter test, and clicking "Download Starter Repo (.zip)" downloads a valid `.zip` containing the Golden Next.js + Postgres template injected with the AI's files.
4. Slice 4 — Interactive Live Preview, 10-Slide Deck & 60s Demo Kit (Heet):
   - Criteria: Tab 1 renders interactive metrics and a table where clicking "+ Add" inserts a new row into state; Tab 3 navigates through all 10 generated slides and exports `.md`; Tab 4 renders the 60s timestamped script, ranked CoNSTruct "Build Next" checklist, and working screen-recorder button.

## Real vs mocked (for the pitch)
- Real (you): Live LLM structured JSON generation, BYOK model/key routing, Zod schema validation, interactive Tab 1 state, real `.zip` repository packaging with Prisma/Vitest files, and live 10-slide + 60s script generation.
- Mocked (proposed): Instant in-browser preview renders from the validated JSON schema rather than spinning up a separate cloud Postgres container per click; if a live API call fails or no key is entered, a pre-validated Golden Fallback Template loads transparently.

## Team split (Blue10.1 — 1 owner per file area)
- Heet: Frontend studio UI, interactive live preview renderer, 10-slide deck viewer, and 60s demo tab (`src/app/page.tsx`, `src/components/*`, `src/types/hackstack.ts`).
- Parv: Golden Next.js + Postgres base template, Zod schema validator, and ZIP repo packager (`src/templates/*`, `src/lib/validator.ts`, `src/lib/packager.ts`).
- Aryan: Server-side LLM structured JSON pipelines (Architect + Pitch/Demo prompt), BYOK router, and 10-prompt evaluation test set (`src/app/api/generate/route.ts`, `src/lib/prompts.ts`, `src/lib/eval-prompts.json`).