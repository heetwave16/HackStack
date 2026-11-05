# HackStack (Team Blue10.1 — NST-ADYPU)

> **For 2nd–3rd year engineering students on 2–3 person hackathon teams, HackStack turns a 2–3 sentence idea into a complete, schema-validated full-stack codebase plus an auto-generated 10-slide pitch deck and 60-second demo kit so they spend 100% of their time building the unique feature that wins.**

**Live URL**: [https://hack-stack-sooty.vercel.app](https://hack-stack-sooty.vercel.app)

---

## What HackStack Generates

From a 2-sentence problem statement, HackStack outputs 4 synchronized, schema-validated deliverables:

1. **Tab 1: Live Interactive App Preview**
   Schema-driven entity dashboard with reactive KPI metrics, live search filtering, and dynamic `+ Quick Action` modal to insert new rows and advance lifecycle state in local memory.
2. **Tab 2: Code, Schema & Tests (1-Click Eject)**
   Prisma relational schema (`postgresql`), Next.js App Router API route (`route.ts`), Vitest unit test suite with passing assertions (`starter.test.ts`), `README.md`, and `.env.example`. Click **"Download Starter Repo (.zip)"** to eject a complete, runnable Next.js starter repo.
3. **Tab 3: 10-Slide Pitch Deck**
   CoNSTruct pitch carousel with keyboard navigation (`←`/`→`), bold headlines, speaker notes, and Markdown export (`PITCH_DECK.md`).
4. **Tab 4: 60-Second Demo Kit & Rubric**
   Timestamped 4-segment teleprompter script, browser-native screen recorder (`getDisplayMedia`) with 60-second countdown and `.webm` video download, plus a ranked CoNSTruct "Build Next" judge rubric checklist.

---

## Security & Architecture Baseline

- **Zero Credential Egress**: Shared server keys are disabled for AI generation. Deployments will never forward environment secrets to user-specified endpoints.
- **Provider Allowlist**: Custom gateway URLs are disabled. Only approved provider endpoints are supported:
  - `openrouter`: `https://openrouter.ai/api/v1`
  - `gemini`: `https://generativelanguage.googleapis.com/v1beta`
  - `openai-compatible`: `https://api.openai.com/v1`
- **Redirects & Transports**: Outbound AI fetches use `redirect: "error"`, `credentials: "omit"`, and `cache: "no-store"`. Credentials can never follow HTTP redirects.
- **JEV (TypeSafe AI "System One") Pre-Flight Classifier**:
  - Ingests unstructured ideas and returns structured, type-safe choices + confidence scores in <500 ms.
  - **Safety Gate**: Blocks harmful/prohibited content (HTTP 422) before hitting any LLM.
  - **Complexity Routing**: Routes complex architectures (real-time, IoT, ML, distributed) to high-capability models (`Gemini 3.5 Flash`).
  - **Zero-Latency Fallback**: When `JEV_API_KEY` is not configured, HackStack uses an in-process local heuristic classifier. Generation is never blocked by a network failure.
- **Workspace State Protection**: Generation failures (HTTP 401, 429, 502, network errors) preserve all existing user edits, preview rows, pitch changes, and the baseline reset state.
- **Design Tokens**: Obsidian dark canvas `#090D16`, emerald compile accent `#10B981`, text `#F8FAFC`, Inter & JetBrains Mono typography.

---

## Local Development & Verification

### Prerequisites
- Node.js 20+ (Node 20 or 22 recommended)
- npm 10+

### Setup
```bash
git clone https://github.com/heetwave16/HackStack.git
cd HackStack/HackStack
npm ci
```

### Full Verification Gate
```bash
# 1. ESLint (0 warnings allowed)
npm run lint

# 2. Type-checking (both app and test suites)
npm run typecheck

# 3. Unit test suite (333 tests across 9 suites)
npm test

# 4. Production Webpack build
npm run build -- --webpack

# 5. Git whitespace / diff check
git diff --check
```

---

## Supabase Setup (Optional Persistence)

HackStack runs 100% in-memory with pre-validated presets when Supabase is not configured.

To enable user auth, collaborative project saving, collaborator invites, and private share links:
1. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Open your Supabase project dashboard → **SQL Editor**.
3. Paste and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Includes Row-Level Security (RLS) policies, invite-acceptance RPC, and the `set_updated_at` trigger.

---

## Specialist Agent API

HackStack exposes specialist product agents at `POST /api/agents/run`:
- `product`: Refines problem scope and target user constraints.
- `architecture`: Generates Prisma data models and API contracts.
- `ui`: Proposes table columns, metric formulas, and action labels.
- `code`: Generates unit-tested TypeScript logic.
- `pitch`: Polishes slide headlines and investor talk tracks.
- `qa`: Audits acceptance criteria and identifies edge cases.

Each agent run produces a targeted patch that merges into the workspace without wiping unrelated artifacts.
