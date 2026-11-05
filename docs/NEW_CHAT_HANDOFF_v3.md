# HackStack — Fresh-Chat Handoff v3 (complete merged context)

Date: November 5, 2026

This single file merges, without losing anything: (1) the original planning handoff `docs/NEW_CHAT_HANDOFF.md` ("v1", committed on branch `heet` as `8e6f945`) and (2) handoff v2 — the results of the Nov 5, 2026 working session that **ended in a disconnection mid-task**. Where facts changed, the newer status is stated and the older one is kept as historical.

**How to use:** start a new chat, paste this whole file, and send the short prompt in section 0. The new agent should NOT need the old chats or the two source documents. If the repository has changed since this was written, trust the repository and report the differences instead of proceeding blindly.

---

## 0. Ready-to-paste prompt for the new chat

> Use this handoff document as your complete context — do not ask me to re-explain history. I am a beginner: you handle all coding, debugging, tests, technical setup, scripts, Git, and documentation. I give product feedback, make decisions, and do unavoidable account logins/consent. Explain things plainly and never ask me to copy code or diagnose errors.
>
> Start with section 25 ("Exact next steps"). First inspect the repository safely (no secrets printed, nothing reset/cleaned/reverted), verify the current state against sections 11–12, then finish and fully validate the interrupted security slice (section 9). Ask me before committing, deleting anything, merging branches, spending money, or touching production. Keep changes small and surgical. Do not treat this document as authorization for the entire roadmap or blind PR integration.
>
> Product direction and all major decisions are already settled — see section 14; do not re-ask them. After the security slice comes CI, then docs updates, then the Phase 1 UX blueprint work (sections 15 and 21).

---

## 1. How to interpret this handoff

This document consolidates user requirements, implementation history (earlier working sessions plus the Nov 5 session), and planning reviews. **It is not proof that proposed features are implemented or that historical checks still pass.** Evidence categories:

- **Historical implementation/validation** (sections 6–8): reported by earlier compacted sessions. Inspect Git and source before relying on its current state.
- **Nov 5 session work** (sections 9–13): findings that were actually reproduced offline, then fixed, with recorded validation runs — but everything is **UNCOMMITTED**, and the session was cut off by a disconnection **before the final full re-validation**. Re-verify before building on it.
- **Source-review findings** (section 24): observed in source during read-only reviews; bugs marked OPEN were not necessarily reproduced. Line numbers are navigation hints and may move.
- **Proposals** (sections 15–23): recommended future product behavior and architecture. Not automatically approved simply because documented.
- **Unresolved**: needs user clarification, a technical spike, current verification, or external account authorization. Only a few remain (sections 14 and 26).

The v1 planning review made no application changes and performed no fresh Git inspection, test execution, build, browser test, live AI call, or live Supabase verification. The Nov 5 session DID make changes (section 9). This handoff file is documentation, not implementation of the redesign.

## 2. What HackStack is (agreed product direction)

HackStack is a **guided workspace that helps students turn a hackathon problem statement into a feasible MVP, a working project they understand, and an honest submission — with or without AI.**

Agreed direction (proceeded with as recommended defaults in the Nov 5 session; can be revisited but do not re-litigate without reason):

- Audience: **beginner students and small teams building web-app hackathon projects** (recommended initial scope, not an approved permanent limitation).
- Code runs in the **student's own editor** with runnable starters — NOT a full in-browser IDE; arbitrary in-app code execution is a much larger security/product scope and is deferred.
- The **non-AI core must stand alone** (section 16): structured brief, MVP scoping, tasks with dependencies, README/license builders, save/restore, manual deck/demo editing. AI is optional assistance at real bottlenecks, never fake success.
- Meaningful complexity should come from reliable state, dependency-aware planning, safe integrations, validated templates, change impact, and honest evidence — not feature count or extra agents.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind, Zod, Supabase. One deployable app (modular monolith), no microservices (section 17).

## 3. What the user wants

The user is a beginner and is dissatisfied with the app's behavior, generic output, UI/UX, and disconnected features. They want:

- A deliberate UI/UX reinvention, with features placed coherently.
- Reliable current behavior before feature expansion.
- Maintainable, adaptable architecture where changes have understandable effects.
- Substantial useful functionality without AI.
- A full student hackathon roadmap, not just generated artifacts.
- Central problem-statement/idea input.
- GitHub create/connect, including explicit README/license choices.
- Vercel and Supabase connections with suitable authorization.
- Google/GitHub identity where appropriate.
- Carefully selected specialist system prompts and intelligent assistance.

The user expects to prompt, review, make product choices, and manage a little configuration — **not manually implement code**. No visual mockup or exact release calendar has been approved yet.

## 4. How we work (roles and style)

**The user (beginner) does:** explain goals and priorities; choose product/visual direction; review screenshots, flows, and acceptance behavior; own provider accounts; perform unavoidable logins/consent/configuration; rotate exposed credentials; approve bills, production, and destructive actions. Never paste secrets into chat.

**The coding agent does:** everything technical — safe inspection, code, tests, debugging, dependency work, scripts, docs, migration prep. Proposes small bounded slices in plain language BEFORE implementing. Preserves all existing/uncommitted/unowned work. Specifies exact permissions and explains unavoidable setup one step at a time. Never asks the beginner to manually copy application code as the implementation method. Never claims a test, build, connection, or deployment passed without evidence. Distinguishes verified fact vs. historical claim vs. proposal. No branches/commits/pushes unless the user agrees.

**Style rules:** keep diffs surgical — editor tools previously reformatted whole files and that churn had to be removed via reconstruction with TypeScript AST-equivalence checks; avoid unrelated reformatting or reconstructing files unnecessarily. Explain every setup step one action at a time. End each session with: what changed, what was verified, what remains, and the next decision needed from the user.

## 5. Repository, environment, and tooling facts

- GitHub repo: `heetwave16/HackStack`. Mac workspace root: `/Users/heet/Documents/HackStack`. **Actual app root (nested git repo): `/Users/heet/Documents/HackStack/HackStack`** — run commands there. Paths below are relative to the actual application root unless stated otherwise.
- Local machine: Node v26.12.0, npm 11.20.0, macOS (Zed editor with its agent; graphify skill installed).
- Key deps: next 16.4.5, react ^19, zod 4.6.7, @supabase/supabase-js ^2.57.4, jszip, lucide-react. Dev: vitest 2.1.9, jsdom 26.1.0. Test script is `vitest run`.
- App routes: `/` (studio page), `/api/generate`, `/api/agents/run`, `/api/ai/models`, `/share/[token]`.
- Other top-level dirs: `landing/` (separate Next app; deployment boundary unconfirmed — verify before consolidating with the main app), `spikes/`, `supabase/` (schema.sql), `docs/`, `graphify-out/` (deleted from tracking mid-session — section 23).
- A local `.env.local` exists on the user's Mac. It was never read and must never be read or printed. `.env.example` should contain placeholders only.
- **Default Turbopack build fails on the user's Mac sandbox** (PostCSS worker port-binding, "Operation not permitted"). Use `npm run build -- --webpack` until that changes; do not silently alter build config to bypass it.
- Historical Git state noted when v1 was written (branch `heet`, HEAD `5582bb4`, the PR #16 merge; not reverified then) — superseded by section 11; always re-verify.

## 6. Earlier local fixes to preserve (historical implementation)

The earlier bugfix session began with a clean tree but ended with uncommitted changes; those were later committed on `heet` (`863a595`) and partially reappear as `6958b48` ("feat: add workspace state management and component unit tests") on `zed`. Do not assume the working tree is still identical.

### Dependencies and tooling

The original `node_modules` did not match the committed lockfile. Missing Supabase and mismatched Next/ESLint/Zod were repaired with:

`npm ci --cache .next/npm-cache --no-audit --no-fund`

Added exact test dependencies `vitest@2.1.9`, `jsdom@26.1.0`; changed test script to `vitest run`; enabled automatic JSX transform in `vitest.config.mjs`. Lockfile churn was checked at the time: no pre-existing package versions changed or entries removed; only test/platform dependency entries were added. (`node_modules` mismatched the lockfile once more later; consider `npm ci` again if it looks wrong — section 25, step 4.)

### Controlled Preview workspace

Files: `src/app/page.tsx`, `src/components/PreviewTab.tsx`, new `src/lib/workspace-state.ts`, new `src/lib/__tests__/preview-workspace.test.ts`.

Reducer state contains current `output` plus separate `previewBaseline`. Actions:

- `replace`: establish a new output and baseline.
- `edit-preview`: update current rows/KPIs.
- `reset-preview`: restore baseline without wiping unrelated artifacts.
- `agent-patch`: targeted merge; update baseline separately when Preview is intentionally patched.

Page owns state; Preview receives controlled `result`, `initialRowCount`, `onChange`, and `onReset`. Regression coverage was added for remounts, pitch patches, save snapshots, reset, and replacement.

**This alone does not implement refresh autosave or cloud restoration.** Preserve these invariants when incorporating PR #18.

### Recent-project freshness

Files: `src/components/studio/ProjectPanel.tsx`, new `src/lib/__tests__/project-panel.test.ts`.

Revision increments refetch recent projects after saves even when the ID stays the same. Obsolete fetch responses are ignored after user change/unmount. Failures surfaced; save uses try/catch/finally; notice callback held via ref to avoid fetch loops. Tests cover same-ID save/load freshness, stale responses, query failure, rejected fetch.

### Agent patch normalization

Files: `src/lib/agents.ts`, `src/lib/__tests__/agents.test.ts`.

Anchored timestamp parsing prevents canonical `0:15 - 0:30` being misread as `15 - 0`. Omitted columns/rows remain omitted rather than empty arrays. Rows-only patches normalize against current columns. Preserve parse-to-merge canonical timestamp ranges.

### Reported working-tree ownership (that earlier session)

Modified: `package.json`, `package-lock.json`, `vitest.config.mjs`, `src/app/page.tsx`, `src/components/PreviewTab.tsx`, `src/components/studio/ProjectPanel.tsx`, `src/lib/agents.ts`, `src/lib/__tests__/agents.test.ts`. New: `src/lib/workspace-state.ts`, `src/lib/__tests__/preview-workspace.test.ts`, `src/lib/__tests__/project-panel.test.ts`. Concurrent/unowned at the time: `.env.example`, `graphify-out/`.

## 7. Historical validation and limitations

Previously passed (earlier bugfix session): `npm run lint`; `./node_modules/.bin/tsc --noEmit`; `npm test` — 25 cases in 5 files; `git diff --check`; `npm run build -- --webpack`. The default Turbopack build failed in that environment because a PostCSS worker attempted local port binding (`Operation not permitted`); the webpack production build passed and the default build configuration was not changed just to bypass the sandbox.

Not established then: live AI/provider success, actual Supabase auth/save/load/RLS, complete browser desktop/mobile flows, exported starter correctness across variants.

jsdom tests mock Supabase/dialog behavior. Test files are excluded from ordinary root TypeScript checking, so add separate test-file type-checking rather than equating Vitest success with type safety. `STATUS.md`, `PLAN.md`, and `docs/journey.md` contain historical claims and event-specific assumptions — prefer source and fresh checks. No `.github/workflows` existed at that time (still none — section 11). Fresh validation is always required; historical passes don't count (section 22).

## 8. PR history (verify actual merge state before action)

Reported merged:

- **PR #14 — Harden AI JSON repair and model fallback**, branch `heetwave16-bookish-tribble`: normalization/repair before Zod, removal of incompatible OpenRouter response formatting, retries/fallback models, regression tests.
- **PR #16 — Unify agent patches with Studio workspace**, branch `heetwave16-turbo-lamp`: specialist outputs connected to Preview/Code/Deck/Demo; targeted merging preserves unrelated artifacts; tolerant patch normalization and tests.
- **PR #17 — Redesign Studio layout and interactive preview**, branch `heetwave16-didactic-spoon`: main-canvas NodeGraph removed, AgentWorkbench in rail, four tabs accessible, schema-aware record creation/status interactions. Historical browser smoke covered record creation, KPI update, status transition.

Reported pending/open:

- **PR #15 — Harden OpenRouter routing and agent generation**, branch `origin/heetwave16-legendary-spoon`: discover/rank suitable free text models; exclude unsuitable models; reasoning/token-budget/output-repair handling; retry unavailable models; dependency-safe agent waves; routing/repair tests; ignore local Graphify artifacts. Historical validation reported lint, TypeScript, 13 tests, build, fallback API smoke. Live discovery still needed configured credentials.
- **PR #18 — Persist Studio work and surface AI failures**, branch `origin/heetwave16-probable-goggles`: preset brief starters rather than fake AI success, explicit errors, opt-in offline demo, missing-key actionable 401, localStorage/Supabase snapshot autosave/restore including agents, schema/latest-project changes. Historical validation reported lint, TypeScript, 10 tests, build.

**Neither pending PR was merged** as of the last observations (Nov 5, 2026). They overlap with the current security slice in `page.tsx`, API routes, agents, and Studio components — reconcile behavior deliberately instead of blindly taking one side. Preserve from them: resilient routing/repair, explicit failures, opt-in demo, full snapshots/restore, controlled Preview edit/reset semantics, targeted patches, and the interactive workspace.

## 9. What the Nov 5, 2026 session did (the security + reliability slice)

All of this is in the UNCOMMITTED working tree (section 12). **The session was cut off by a disconnection before the final full-suite re-validation, so re-verify with fresh checks before building on it.**

**Reproduced first (offline, intercepted — no real keys or network):**

1. Unauthenticated `POST /api/agents/run` could forward a deployment server key to a caller-chosen URL (credential egress). Fixed below.
2. `normalizeAndRepairStudioOutput` could loop forever on duplicate columns like `['field2','field2','status']`. Fixed below.
3. Generation used a short generic prompt although a detailed schema prompt existed. Fixed below.
4. Generation failure replaced the user's workspace with fallback demo content. Fixed below.

**Implemented:**

- `src/lib/ai-policy.ts` (new): provider allowlist with fixed base URLs (`openrouter` → `https://openrouter.ai/api/v1`, `openai-compatible` → `https://api.openai.com/v1`, `gemini` → `https://generativelanguage.googleapis.com/v1beta`). Custom `baseUrl` values are rejected outright ("Custom gateway URLs are disabled"). `requireCallerApiKey()` — deployment/env keys are never used for AI calls; callers must supply their own key (format-validated). `GatewayError` with codes: `missing_key | provider | timeout | invalid_response | unsafe_endpoint | invalid_request`.
- `src/lib/ai-http.ts` (new): shared HTTP→error mapping (`aiErrorResponse`, `aiJson`).
- `src/lib/ai-gateway.ts` (rewritten): outbound fetches use `redirect: "error"`, `credentials: "omit"`, `cache: "no-store"` (credentials can never follow a redirect); Zod-validated provider responses; Gemini key moved from URL parameter to header; timeouts during **body reads** are correctly reported as `timeout` (not `invalid_response`) by checking `options.signal?.aborted`.
- API routes (`generate`, `agents/run`, `ai/models`): no deployment-credential fallback, no caller-controlled destination, no raw upstream diagnostics leaked; `generate` now uses the real `HACKSTACK_SYSTEM_PROMPT` + `buildHackStackUserPrompt` schema prompt wiring; the automatic fallback-result replacement was removed.
- `src/app/page.tsx` (+ `StudioHeader.tsx`, `describe-failure.ts`, `models.ts`): generation failures now **preserve the current workspace, its reset baseline, and the save target**; actionable missing-key errors; provider switches clear the key; the custom-URL control was removed; OpenAI-compatible defaults to `gpt-4o-mini`.
- `src/lib/validator.ts`: duplicate-column repair made bounded (terminates); regression tests added.

**Validation that PASSED during the session (before the final round of edits — see section 25, step 5):**

- 280/280 tests across `ai-gateway.test.ts` (40), `ai-security-routes.test.ts` (233), `validator.test.ts` (7).
- `generation-ui.test.ts` 13/13 (workspace preservation across 401/400/429/502/504, network failure, malformed response, legacy-fallback response; key handling).
- `npm run lint`, `tsc --noEmit --incremental false`, separate test-file TypeScript check (8 files), `git diff --check`, and `npm run build -- --webpack` — all passed.
- An independent read-only security review found **no production blockers inside this slice**, and one P2 issue (body-read timeouts misreported as invalid JSON) — which was then fixed in the final `ai-gateway.ts` rewrite.

**Never verified (still true):** live provider calls, live Supabase auth/save/RLS, real browser flows, exported starter correctness, remote PR state, anything after the last transcript export (the session was cut off mid-task).

## 10. Session activity log (what the Nov 5 agent actually read, fetched, ran)

So the next agent does not redo searches or lose nuance. All reads were of repo source unless noted; no secrets were ever read or printed.

**Inspected / searched:**

- Read the complete v1 handoff (`docs/NEW_CHAT_HANDOFF.md`, sections 1–19) and used it as the work plan; verified its claims against the real repository before relying on them.
- Loaded the graphify skill but did NOT rebuild the graph — `graphify-out/graph.json` already existed (544 nodes / 1,055 edges / 25 communities, Nov 5 report). The user later removed `graphify-out/` from tracking; it is gone from disk and was never a runtime feature.
- Safe Git inspection at session start and repeatedly after: `status --short --branch`, `log`, `for-each-ref`, `diff --stat` (never env files, never remote URLs with credentials). This is how it detected the mid-session checkout change `heet` → `zed`.
- Read source before editing: `package.json`, `src/lib/ai-gateway.ts` (before and after), `src/app/api/generate/route.ts` (before and after), `src/app/api/agents/run/route.ts`, `src/app/api/ai/models/route.ts`, `src/app/page.tsx` (several passes), `src/components/studio/StudioHeader.tsx`, `models.ts`, `describe-failure.ts`, `src/lib/validator.ts`, `src/lib/prompts.ts`, `src/types/hackstack.ts`, `tsconfig.json`, `README.md`, plus the existing test files in `src/lib/__tests__/`.
- Explicitly checked that `docs/PHASE_1_BLUEPRINT.md` and `graphify-out/` no longer existed on disk after the branch switch.

**Ran (all offline — synthetic sentinel keys, intercepted/mocked network; no real credentials, no live calls):**

- Reproduction 1: executed the agent route in-memory with a fake deployment key and a caller-chosen URL; proved the route forwarded that key to the URL without authentication (the credential-egress bug).
- Reproduction 2: fed the validator `['field2', 'field2', 'status']`; the repair loop exceeded a 250 ms VM execution limit and was safely interrupted (the non-terminating-repair bug).
- Validations (results in section 9) plus `node --version` / `npm --version` (v26.12.0 / 11.20.0).
- Dispatched an independent read-only security review of the finished slice: verdict "no production blockers inside this slice", one P2 issue (body-read timeouts misreported as `invalid_response`) — subsequently fixed in the final `ai-gateway.ts` rewrite via the `options.signal?.aborted` check.

**Fetched from the web:**

- `https://docs.typesafe.ai/concepts/how-to-build-with-system-one` (Jev / System One docs): code stays in control, AI answers narrow typed questions, structured type-safe outputs, calibrated confidence (RLCD), ~100 ms calls, three architectures (traditional / LLM agents / AI-powered software). This is the basis of the JEV stance in section 14 — re-verify the docs before any real integration.

**Deliberately did NOT do (boundaries kept):**

- No live AI/provider calls, no live Supabase auth/save/RLS checks, no browser E2E, no remote fetch/push.
- No commits, no branch creation/merging, no PR merges (PR #15/#18 untouched), no CI creation, no schema/migration changes.
- No reads of `.env` / `.env.local`; no secret values printed, stored, or repeated.
- The final full-suite re-validation after the last file rewrites was NOT completed — the session was interrupted there, which is why section 25 step 5 exists.

## 11. Git state at the end of the Nov 5 session (verify fresh before acting)

The last session ended mid-task (disconnection), so treat this as "last observed," not current truth. Run safe `git status/log/diff` first (section 25, step 1).

- The session started on branch `heet` at `8e6f945` ("Create NEW_CHAT_HANDOFF.md"; earlier local fixes committed in `863a595`).
- **Mid-session the user checked out branch `zed`** (bringing staged deletions of `graphify-out/` and a `.gitignore` edit). All security-slice work happened on `zed`, which was at `6958b48` ("feat: add workspace state management and component unit tests", ahead 1 of `origin/zed` at that moment; whether it was later pushed is unverified).
- **Nothing from the security slice is committed.** It exists only as working-tree changes (section 12).
- Remote branches seen (stale cache, no fetch was performed): `origin/heet` @ 8e6f945, `origin/zed` @ 5582bb4 (PR #16 merge), `origin/heetwave16-legendary-spoon` (PR #15, open), `origin/heetwave16-probable-goggles` (PR #18, open), plus `Parv`, `aryan`, `heetwave16-patch-1`, and a local `feat/slice-2-ai-pipeline`.
- PR #15 and #18 were still NOT merged anywhere as of that snapshot (section 8).
- No `.github/workflows` exists (`.github/` has only agent config) — CI is still to be created.

## 12. Working tree at session end (last observed on `zed`)

Modified (uncommitted, by the agent): `.gitignore` (user's edit — leave it), `src/app/api/agents/run/route.ts`, `src/app/api/ai/models/route.ts`, `src/app/api/generate/route.ts`, `src/app/page.tsx`, `src/components/studio/StudioHeader.tsx`, `src/components/studio/describe-failure.ts`, `src/components/studio/models.ts`, `src/lib/ai-gateway.ts`, `src/lib/validator.ts`, `src/lib/__tests__/validator.test.ts`.

New files (untracked, by the agent): `src/lib/ai-policy.ts`, `src/lib/ai-http.ts`, `src/lib/__tests__/ai-gateway.test.ts`, `src/lib/__tests__/ai-security-routes.test.ts`, `src/lib/__tests__/generation-ui.test.ts`.

Staged (user's): deletion of all `graphify-out/` files from tracking (plus `.gitignore` entries ignoring it). The graph (544 nodes / 1,055 edges, Nov 5) is gone from disk; it was a navigation aid only, never a runtime feature. Do not rebuild it unless asked; recoverable from git history if ever needed.

**Junk to clean (with user confirmation):** macOS Finder duplicates appeared as untracked files — `docs/NEW_CHAT_HANDOFF 2.md`, `docs/NEW_CHAT_HANDOFF 3.md`, `docs/NEW_CHAT_HANDOFF 4.md`, `src/lib/__tests__/preview-workspace.test 2.ts` … `5.ts`, `src/lib/__tests__/project-panel.test 2.ts` … `5.ts`, `src/lib/workspace-state 2.ts`, `src/lib/workspace-state 3.ts`. They don't match vitest's `*.test.ts` pattern, so they are inert clutter. Recommend deleting them after confirming they are plain copies (section 25, step 3).

**Lost document:** `docs/PHASE_1_BLUEPRINT.md` was created on the `heet` checkout, then disappeared from disk after the branch switch (verified absent on `zed`). Its essentials are preserved in section 15, so it can be recreated from here. Likewise, v1 of this handoff is recoverable via `git show heet:docs/NEW_CHAT_HANDOFF.md`.

## 13. Security incident status

A previous concurrent `.env.example` edit contained a real-looking Supabase server secret. **Do not read, display, repeat, or paste the value.** Do not overwrite unowned edits casually. The user was warned to rotate/revoke it, store actual credentials in ignored local environment configuration, and retain placeholders in example files. **The user confirmed on Nov 5, 2026 that the credential was rotated/revoked — do not ask again.** Still never print secrets or credential-bearing URLs. No credentials were ever intentionally used for live validation.

## 14. Decisions already made — do not re-ask

1. **Security slice approved and implemented** (Nov 5): lock AI calls to approved provider endpoints, disable custom gateway URLs and deployment-key fallback, require caller-supplied keys, preserve user work on failure. Details in section 9; final re-validation pending (section 25, step 5).
2. **The previously exposed Supabase server credential was rotated/revoked** — the user confirmed this on Nov 5, 2026 (resolves the earlier open item). Do not ask again. Still never print secrets or credential-bearing URLs.
3. **JEV is defined** (resolves the earlier unknown; never invent an expansion): "System One" by TypeSafe AI (`docs.typesafe.ai`) — a machine-native decision engine (not a chatbot) that ingests unstructured input and returns structured, type-safe choices, scores, and calibrated confidence in ~70–500 ms, marketed as 40–200× faster/cheaper than frontier LLMs for routing, classification, and safety-checking. Standing stance: a **potential decision/routing component for HackStack's own logic** (e.g., routing, classification, triage) — **NOT a safety boundary and NOT integrated yet.** Any real integration needs a separate spike (docs were fetched and read once; verify current docs before relying on them). Do not block basic security/reliability triage on JEV.
4. **Execution scope:** guided planning + runnable starters + the student's own editor — not an app built/run entirely inside HackStack. Proceeded with as the recommended default.
5. **Initial audience scope:** beginner/small-team web-app hackathons. Proceeded with as recommended default (not an approved permanent limitation).
6. The user wants a **"production ready" trajectory**: security baseline first, then CI, docs, and honest production checks — not feature explosion.
7. Still open: no visual mockup or exact release calendar has been approved; phases carry no promised calendar (section 21).

## 15. UI/UX blueprint (proposal — drafted, not yet user-approved)

Status: proposal drafted Nov 5 (originally saved as `docs/PHASE_1_BLUEPRINT.md`, lost in the branch switch — recreate from this section); needs user review before implementation.

Design around the student's questions: What problem? What can we finish? What next? How build/connect? What really works? What submit?

Six persistent, nonlinear views replacing the current Studio layout (existing tabs move inside them: Preview/Code → Build; Deck/Demo → Present; agents become contextual, not permanent command-center furniture):

| View | Student question | Primary action |
| --- | --- | --- |
| Overview | What should we do next? | Continue the next useful task (empty workspace → Start planning) |
| Brief | What problem are we solving? | Accept a brief revision (drafts allowed; optional AI refinement is a proposal, never auto-accepted) |
| Plan | What can we finish? | Accept MVP scope (essential/optional/cut; tasks have stable IDs, dependencies, owners, effort ranges, completion evidence) |
| Build | How do we make it work? | Configure a certified starter, then continue a build task (clearly distinguish sample Preview / exported code / locally running app / deployed app) |
| Ship | How do we connect and release safely? | Review one external operation before running it (GitHub create/connect/publish are separate actions; Vercel/Supabase start read-only) |
| Present | What can we truthfully submit? | Prepare a submission snapshot (pinned to an exact version; stale claims link to changed artifacts) |

View details from the original blueprint:

- **Overview:** next useful action, why it matters, prerequisites/completion check, blockers, deadline, recent changes, last verified version.
- **Brief:** problem/users/constraints/success criteria, rules, assumptions, decisions.
- **Plan:** essential/optional/cut MVP, feature acceptance criteria, dependencies, assignments, effort ranges.
- **Build:** starter/capability choices, setup guidance, code artifacts, prototype, verification.
- **Ship:** repository, deployment, database connection, configuration, release status.
- **Present:** editable deck/story, rehearsal/recording, evidence, submission checklist/snapshot.

These are persistent nonlinear views, not a rigid sequence of locked wizard steps.

**Starting screen:** prominent central question **"What problem is your team trying to solve?"**. Actions: Start planning; optional AI refinement; open existing project; explore an explicitly labeled example. Progressively collect deadline/timezone, team skills/available hours, existing code, event requirements, and constraints. Do not require an API key, full questionnaire, or three cloud integrations before useful work.

**Existing components' future placement:** Preview/Code inside Build; Deck/Demo inside Present; agents contextual instead of permanent command-center furniture; models/keys in advanced settings; connections contextual plus central management; pipeline reflects actual operations instead of implied downstream success. Header prioritizes project name, deadline, local-versus-cloud save state, and team (distinct device-save vs cloud-sync states).

**Visual and interaction rules:** calm readable hierarchy, consistent tokens/components, one primary action per screen, optional contextual drawer rather than three crowded permanent panels. Accessible light/dark themes, keyboard/focus, mobile layouts, reduced motion, clear text status rather than color alone. Design empty/loading/failed/permission-denied/conflict/stale/unsaved/success states before implementation; explain recovery beside the affected action; no synthetic business metrics presented as project progress; accepting a plan never auto-touches code/GitHub/schema/deployments.

**Phase 1 exit test:** a beginner can identify the next action, understand recovery states, and distinguish a plan / sample Preview / code / running app / deployment.

## 16. Non-AI core that must stand alone

- Manual structured brief and decision history.
- MVP essential/optional/cut classification.
- Editable tasks with stable IDs, dependencies, owners, effort ranges, blockers, completion checks, and small learning explanations.
- Transparent rule-based deadline/scope advice, not certainty about feasibility.
- Finite vetted starter capabilities configured through explicit choices.
- README/setup/license builders; preserve required third-party notices.
- Save/recover/restore/export.
- Manual document/presentation editing, submission requirements and evidence.
- Demo rehearsal and recording where browser support permits.

A useful task is "Allow a teammate to sign in and prove another team's project is inaccessible," with prerequisites and completion evidence — not simply "implement auth."

**Do not promise arbitrary natural-language-to-working-app without AI.** The deterministic system supports finite recipes/capabilities; unsupported features require custom implementation and must be labeled accordingly.

Certify one genuinely runnable starter family first. A local-workflow starter can prove the first slice; add a separately tested Supabase-backed recipe later. Keep legacy Prisma compatibility while deliberately choosing the future recipe. Avoid selectable stack claims without real build/export support.

**No AI is not the same as offline.** Clearly distinguish device save, cloud sync, last-known provider state, and unavailable network actions. Do not promise first-use offline support without building/testing it.

## 17. Connectedness and adaptable architecture

Trace relationships: Problem + rules → accepted MVP → features + acceptance criteria → tasks → artifacts → build/workflow evidence → commit/deployment/submission → pitch/demo. Each claim should refer to evidence or be labeled planned. A deployed page does not establish correct authentication/database behavior.

**Change handling:** a brief/schema/scope change should identify possibly stale tasks/code/forms/tests/docs/demo steps and show a reviewable impact set. Preserve the last working snapshot and manual edits. **Accepting a plan does not automatically update code, GitHub, database schema, deployment, and deck.** External actions need separate operations/results/consent. No silent overwrites, migrations, or redeploys. Changes produce reviewable impact sets, not silent propagation.

**Modular monolith:** keep Next.js/TypeScript/Tailwind/Zod/Supabase and one deployable app, with focused boundaries:

| Module | Responsibility |
| --- | --- |
| Workspace | Identity, revisions, current state, persistence/recovery |
| Planning | Brief, scope/tasks, deterministic dependency and scheduling rules |
| Artifacts | Versioned code, README, prototype, deck, demo |
| Verification | System-owned evidence tied to exact versions |
| Connections | Provider grants, ownership, selected resources |
| Operations | Retryable side effects, progress, IDs, reconciliation |
| Optional AI | Prompt registry, gateway, validated proposals |

UI calls application commands; domain rules avoid React/provider dependencies; external adapters are server-side. Runtime validation protects every boundary. No microservices/full event sourcing/generic plugin framework needed initially.

**Data contracts:** evolve `HackStackOutput` into a legacy compatibility adapter, not the whole future product model. Do not replace it with another enormous globally coupled object. Proposed concepts:

- Project/membership/event profile.
- `WorkspaceSnapshotV1` (versioned, revision-bound, no credentials).
- BriefRevision with accepted decisions/constraints.
- Feature with scope/acceptance criteria/capabilities.
- Task with dependencies/owner/status/evidence (stable IDs).
- Artifact/ArtifactVersion with version/origin/input dependencies/manual changes.
- Connection with owner/scopes/provider resource references (server-only credential references — never values).
- Operation with action/result/retry and returned resource IDs.
- CheckResult with type/outcome/exact artifact or commit/timestamp.

Use relational data where relationships/authorization matter, versioned JSON for appropriate documents. Credentials stay separate, encrypted and server-only — never browser snapshots/localStorage/prompts. Bind asynchronous results to project/base revision; reject stale responses. Use revision-aware saves/conflicts. Validate restored JSON. Migrate old snapshots explicitly: an original baseline absent from legacy data cannot be reconstructed magically — disclose it. Models never award verification passes.

Typed field/capability definitions can drive supported UI rendering, validation, tasks, and starter options. New capabilities still need renderers/rules/tests/migrations. Adaptability means contained predictable changes, not automatic arbitrary propagation.

## 18. Integration plan and security boundaries

Official documentation was checked November 5, 2026. Capabilities below are documented, **not live-tested in HackStack**. Recheck before implementation.

**Four separate concerns — do not conflate** (HackStack's database/control plane is separate from student application databases):

1. Sign into HackStack through Supabase Auth (Google/GitHub identity).
2. Authorize HackStack to act on a provider account.
3. Select accessible repository/project/deployment resources.
4. Implement authentication inside the student's application.

**GitHub:** separate actions — connect existing repository; create truly empty repository; initialize README/license/gitignore; publish a reviewed starter. Ask explicit owner, name, description, visibility, README choice, license including none, gitignore. API defaults may be public: do not rely on defaults. Optional project license does not remove third-party obligations. Prefer least-privilege GitHub App authorization. **October 13, 2026 documentation introduced `repository_creation:write`; do not repeat the outdated blanket assertion that GitHub Apps cannot create repositories.** Spike delegated-user/installation token behavior, personal/org ownership, selected-repository access and organization approvals. Contents write only when custom file commits are needed. README/license initialization is not truly empty; empty repos are not deployable. No automatic overwrite of existing code. Begin with reviewed one-way publish, not complex bidirectional synchronization.

**Vercel:** separate integration authorization from identity login. Start with authorized project/deployment reads and existing project selection; add project creation/deploy writes later. Vercel's GitHub access is separate from HackStack's. Confirm access to newly created repositories and team ownership. Management permissions for Sign in with Vercel were documented as private beta; do not assume ordinary sign-in grants management.

**Supabase:** Supabase Auth is not Management OAuth. Project publishable/secret keys are not platform-management credentials. Start with metadata reads and explicit selection of an existing project through Management OAuth, or clearly labeled manual attachment. Mere connection does not need a database password/service secret. Schema/auth/config writes require separate permissions, review, and consent.

**Shared integration rules:**

- Spike app registration/review/public availability before promising launch behavior.
- Distinguish link attached, authorized, resource selected, verified, stale, missing permission, revoked, deploying, failed.
- Server-side token exchange/use; encryption with separately managed keys; least scopes; refresh/revocation/disconnect.
- Session-bound single-use state, exact callbacks, PKCE where supported. Do not assume legacy Vercel integration flow matches its sign-in flow.
- No management credentials in browser storage, `NEXT_PUBLIC_*`, logs, exports, prompts, or student runtime environments.
- Record returned resource IDs immediately; reconcile uncertain outcomes before retries. Do not assume create APIs have idempotency keys.
- Signed webhook/raw-body validation, tenant/resource checks, deduplication, bounded polling/reconciliation.
- Never delete a successful repository because a later deployment failed.
- Explicit owner/team/visibility/environment/cost/prod/migration/destructive-action consent.
- Show personal-resource/team-departure risks; logout is not revocation.

**References (checked Nov 5, 2026):**

- https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
- https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/
- https://vercel.com/docs/integrations/create-integration/vercel-api-integrations
- https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration
- https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-github

## 19. Optional AI and quality controls

Offer help at actual bottlenecks: clarify problem, review deadline scope, explain build error, suggest tests, improve pitch from verified features. Beginners should not choose agent/model before making progress.

Use a deterministic versioned prompt registry selected by task/context/capabilities/allowed scope/budget. No extra model needed to choose every prompt.

Proposed sequence: clarify → propose scope/assumptions → student acceptance → architecture/design when useful → bounded code proposal → separate actual verification → evidence-aligned presentation.

Context: authoritative project snapshot/version, minimal needed data, no credentials; explain external sharing. Results: project ID/base revision, scoped diff, assumptions, verification steps. Reject stale responses and review consequential changes. Agents cannot bypass authorization or consent for cloud/database writes.

Budget/cancel/timeout/retry controls; no implicit paid fallback. Optional copyable prompts can help without built-in API access. Failure preserves current work; demo fallback is explicit opt-in, never fake success.

Anti-slop means traceable requirements, bounded supported capabilities, real tests, evidence, labeled assumptions, provenance, small changes, and human decisions. No fabricated research/users/metrics/novelty or model-awarded test passes. AI cannot certify originality or human feasibility alone.

JEV: now defined (section 14, item 3); still deferred — candidate only for internal routing/classification decisions in Phase 5, after a real spike.

## 20. Unknowns and risks to account for

- Event rules can forbid templates, AI, prior work or late changes. Capture source/timezone and organizer questions; do not claim compliance from incomplete data.
- Student understanding: can they explain and modify the code, not just download it?
- Team-owned versus personal resources, handoff, billing, school OAuth restrictions.
- Provider registration/approval, quotas/free-tier changes, costs; no "free forever" promises.
- Student privacy, retention/deletion, AI data sharing, secrets in generated content.
- External Git edits/source-of-truth drift and branch conflicts.
- Stale checks/deployment evidence after code changes.
- Template combinations/dependency compatibility/license notices/export paths.
- Browser recorder permissions/support and recording state during navigation.
- Cloud-connected is not app-functional; no-AI is not internet-independent.
- Submission snapshot must not be silently replaced by post-deadline edits.

## 21. Delivery phases and exit criteria

No precise calendar is promised. Estimate after baseline triage and provider spikes. Each slice should be small, testable, reversible.

- **Phase 0 — Safe/reliable baseline:** verify Git/source/PR status, preserve local fixes and unowned changes, reproduce high-risk findings, fix credential egress/bounded repair/prompt wiring/project isolation, reconcile #15/#18 deliberately, verify persistence/permissions and CI. **Status: credential egress, bounded repair, prompt wiring, and failure-preservation are DONE but uncommitted (section 9); project isolation, RLS verification, CI, and PR reconciliation remain.** Exit: no silent loss across navigation/reload/failure/project switching; explicit provider errors; security regressions tested; meaningful baseline save/reset semantics preserved.
- **Phase 1 — Product and UX blueprint:** confirm audience/non-goals and execution scope; navigation, screen flows, design tokens, fixture-backed clickable prototype, all error/empty/loading/conflict states, beginner review. Define domain contracts alongside screen behavior before broad implementation (section 15). Exit: beginner identifies next action and distinguishes planning/sample Preview/code/local running app/deployment.
- **Phase 2 — Versioned workspace foundation:** project identity/revisions, snapshots/adapters/migration, durable brief/tasks/checklists/docs, local recovery/cloud status, validated restore, role matrix, conflict-aware saves and stale-result rejection. Exit: full roundtrip including current edited output and intended reset baseline; no cross-project/account leakage; concurrent edits conflict rather than silently overwrite.
- **Phase 3 — One complete no-AI building path:** manual brief → accepted MVP → dependency roadmap → one real starter → acceptance workflow → save → honest demo/submission. Exit: beginner can run, explain, and make a small change without an AI key. Do not require three provider integrations to establish this value.
- **Phase 4 — Incremental cloud connections:** identity then GitHub create/connect/publish; Vercel/Supabase read-only connection first; additional writes only after technical spikes and explicit consent. Manual provider workflows remain available (section 18). Exit: real test-account proof of least scopes, denial/revocation, ownership, retries, no duplicates and recoverable partial failure.
- **Phase 5 — Contextual AI:** versioned prompts, accepted-context dependency orchestration, scoped proposals, provider budgets/fallback discipline, eval cases for ordinary/vague/infeasible/contradictory briefs. JEV (section 14) is a candidate for internal routing/classification decisions here, after a real spike. Exit: improves user outcomes but manual path works with zero AI calls; no fabricated success or loss on failure.
- **Phase 6 — Broaden/polish:** more certified templates/capabilities, evidence/change-impact improvements, team features, accessibility/performance and onboarding based on user tests (~8 beginners; targets in section 22).

Deferred unless justified by validated needs: arbitrary in-app untrusted code execution, full IDE, real-time multiplayer, marketplace, generic agent/plugin platform, microservices.

## 22. Verification plan and success measures

Fresh validation is required; never reuse historical pass claims.

- Unit/contracts: reducer/reset/patch invariants, bounded malformed-output repair, no-key errors/routing, allowed patch scopes, schema migration, stale async results.
- Persistence: full snapshot restore, project identity, timestamps, account switches, conflict handling, legacy behavior.
- Authorization: owner/editor/viewer/outsider/anonymous against actual test Supabase RLS. Mocks alone cannot verify it.
- Exports: exact supported variants install/build/test in isolation; archive paths/overwrites constrained; no production credentials; never execute untrusted generated content with deployment secrets.
- Provider tests: safe accounts/resources, callback denial/replay, missing scopes, revoke/refresh, wrong owner/team, timeout/retry reconciliation and partial failures.
- Browser desktop/mobile: create record → KPI/status → tabs → pitch-only patch → reset → save/reload → project/account switching; checklist persistence, errors/opt-in demo.
- Accessibility: keyboard/focus, contrast, reduced motion, screen reader statuses, responsive layout.
- CI: inspect configuration then run clean install, lint, app TypeScript, separate test TypeScript, tests, production build, diff check. Historical commands are in section 7. Report sandbox/build restrictions and distinguish the webpack workaround.

Core success metrics: time to working increment, next-task comprehension, code understanding/modification, accurate awareness of unbuilt/unverified work, persistence/recovery, truthful submission — not quantity of generated artifacts.

Proposed user-study targets, not observed results: test around eight beginners; perhaps six can run a core workflow within 45 minutes including setup, explain the next task/check and make a small modification. Everyone should distinguish sample Preview/local app/deployment. Adjust targets after actual research.

## 23. Graphify status

User supplied `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` dated November 5, 2026: 544 nodes, 1,055 edges, 25 communities; reported 99% extracted / 1% inferred. Hubs include `HackStackStudioPage` and `HackStackOutput`, 23 edges each. No import cycles detected. Use the graph first for structural queries when tools allow, then verify source; the latest planning used the supplied report/source, not executed CLI traversal. Do not rebuild for ordinary queries or overwrite unowned graph artifacts. No cycles does not prove loose coupling. Communities include landing app, dependencies/configuration and docs; avoid interpreting metrics as product-quality scores. Graphify is a development navigation aid, not a required runtime knowledge-graph feature.

**Status change:** during the Nov 5 session the user deleted `graphify-out/` from tracking and disk (staged deletion on `zed`). If structural queries are needed, recover it from git history or re-run the graphify skill — but do not rebuild it unless asked.

## 24. Source-review findings and open backlog (what to fix)

Status key: **FIXED (uncommitted)** = fixed in the Nov 5 slice; needs the final re-validation in section 25 step 5. **OPEN** = still to address. Original line numbers are navigation hints and may move.

### Highest-priority security

- `src/app/api/agents/run/route.ts:12–28`: deployment credential fallback combined with caller-controlled `baseUrl`. — **FIXED (uncommitted)**; has regression coverage.
- `src/lib/ai-gateway.ts:39–58`: bearer token sent to that endpoint without central endpoint policy. — **FIXED (uncommitted)** via the `ai-policy.ts` allowlist.
- Generate route checked HTTPS/some hostnames, not comprehensive private-address/DNS/redirect safety. — **FIXED (uncommitted)** for redirects/endpoints (`redirect: "error"` + allowlist); broader SSRF/abuse quotas on API routes remain **OPEN** (infrastructure item below).
- Server-credential egress was the top fix: fixed approved provider hosts for deployment keys; central endpoint/SSRF rules, authorization and abuse quotas. — egress done; quotas **OPEN**.

### Validation/generation

- `src/lib/validator.ts:170–177`: duplicate column repair could fail to progress for `['field2', 'field2', 'status']`. — **FIXED (uncommitted)** (bounded, terminates); regression tests added.
- Detailed `HACKSTACK_SYSTEM_PROMPT` exists at `src/lib/prompts.ts:3–71`, but the generation route around `107–114` used a short generic prompt. — **FIXED (uncommitted)** (real prompt wiring + provider defaults).
- `passesGeneratedCodeChecks` around validator `218–226` uses regex heuristics, not actual compilation. `CodeTab` currently says "Static code check"; the UI must never claim a compiler ran. — **OPEN**.
- Agent patches are permissive and lack complete post-merge scope/contract enforcement; changed-columns-only patches can leave old row keys; AI QA may set check flags. System evidence must not be model-awarded. — **OPEN**.

### Identity/persistence/permissions

- Page owns `projectId` separately from workspace; replacing output may retain a loaded project's save target; late responses have no project/revision isolation. — **OPEN** (next design slice, section 25 step 10).
- Agent context uses previous raw outputs rather than current accepted workspace; hardcoded ordering differs from dependency metadata. — **OPEN**.
- Output-only persistence omits original reset baseline; Demo checklist is local component state. — **OPEN**.
- Reads cast rather than validate stored JSON; share behavior around unsaved revisions is ambiguous. — **OPEN**.
- `updated_at` had insertion default but no update trigger found. — **OPEN**.
- `supabase/schema.sql:82–97`: policies do not consistently enforce owner/editor/viewer roles; member access permits invitation/share actions while editors cannot update. Browser ownership fields also need review. — **OPEN**; needs real-RLS test-project verification — mocks cannot prove it.

### Product honesty/export

- Preview manipulates local sample rows, not generated backend execution. — **OPEN** (label honestly).
- `src/templates/golden-template.ts:63–73` exports a static "Starter ready" page, not Studio Preview. — **OPEN**.
- `src/components/studio/models.ts:18–21` advertised multiple stacks while packaging uses a fixed Next/Prisma template — **check what the Nov 5 edit left here**.
- `src/lib/packager.ts:36–49` accepts additional file destinations/collisions; constrain paths/reserved files/overwrite policy and inspect secret leakage risks. — **OPEN**.
- Header Share copies page URL (`page.tsx:224–232`), distinct from saved-project share — **re-verify after the StudioHeader changes**.
- Preview increments a leading-number first metric synthetically; do not confuse with verified domain calculations. — **OPEN**.
- Model discovery still sends the user's key on key changes (`page.tsx`), although discovery works keyless against public metadata — making it keyless would reduce credential handling. — **OPEN** (optional, non-blocking).

### Remaining infrastructure

- **No CI**, no request limits/quotas on API routes; README/STATUS.md are stale relative to the new security behavior. — **OPEN** (section 25, steps 8–9).

## 25. Exact next steps for the new agent (what to do now, in order)

**A. Safe re-orientation (no changes):**

1. Confirm the app root and run safe `git status --short --branch`, `log -5`, `diff --stat` (never print secret contents or credential-bearing URLs; never reset/clean/revert).
2. Compare the real state against sections 11–12. If reality differs from this document (e.g., work continued after the disconnection), follow the repository and report the differences to the user instead of proceeding blindly.

**B. Finish and fully validate the security slice (the interrupted task):**

3. Delete the macOS duplicate files from section 12 — but only after listing them to the user and getting a one-word OK.
4. Consider `npm ci --cache .next/npm-cache --no-audit --no-fund` if `node_modules` looks mismatched with the lockfile (it was mismatched once before).
5. Run the FULL gate, in this order: `npm run lint` → `./node_modules/.bin/tsc --noEmit --incremental false` → separate test-file TypeScript check → **`npm test` (all files, one run — never only the new ones)** → `npm run build -- --webpack` → `git diff --check`. Fix anything that fails. The final `ai-gateway.ts` / `ai-policy.ts` / `page.tsx` / `generation-ui.test.ts` rewrites were made AFTER the last recorded green run, so a complete fresh pass is mandatory, not optional.
6. Re-check the two original reproductions now have regression coverage (credential egress; non-terminating repair) and that the P2 timeout fix has its regression case (timeout after headers arrive).

**C. Commit checkpoint (user decision):**

7. Propose a single commit for the security slice (suggested message: `fix: lock AI calls to approved providers, require caller keys, preserve work on failure`). No commit/push/branch/PR without the user's explicit OK. Note `.gitignore` + staged graphify-out deletions are the user's staged changes — include or leave them per the user's wish.

**D. Then, one small slice at a time (propose → get OK → implement):**

8. **CI:** add `.github/workflows/ci.yml` running the same gate (clean install, lint, app TS, test TS, tests, webpack build, diff check). Cheap, high value, no accounts needed.
9. **Docs:** update README/STATUS.md to describe the new security behavior (caller keys required, custom gateways disabled, failures preserve work) and the validation commands.
10. **Project identity/isolation slice** (open finding, section 24) — design first, show the plan, then implement.
11. **PR #15/#18 reconciliation** — compare branch behavior against the current tree; propose how to preserve their wins without regressing the security slice. This is a deliberate review, not a merge.
12. **Phase 1 kickoff:** recreate `docs/PHASE_1_BLUEPRINT.md` from section 15, get the user's review, then build the fixture-backed clickable prototype (screen flows + every empty/loading/failed/conflict state) before any broad UI rewrite.

**Do not** start a wholesale rewrite, work on all phases at once, integrate PRs blindly, spend money, provision paid resources, apply production migrations, or make live provider/Supabase calls without explicit consent. Live verification needs narrowly scoped test accounts and the user's involvement. This document is not authorization for the entire roadmap or blind PR integration.

## 26. Quick decisions the user will be asked for (so they're ready)

1. "OK to delete the Finder duplicate files?" → expected answer: yes (they're clutter).
2. "OK to commit the security slice with this message…?" → expected: yes, with the proposed message.
3. "Include your staged graphify-out deletion + .gitignore in that commit, or separately?" → user's choice.
4. "Approve CI workflow file?" → expected: yes.
5. Later: Phase 1 blueprint approval, PR #15/#18 handling, which starter family to certify first, any live-account verification sessions.

## 27. Standing safety rules (always apply, never expire)

- Never read/print/paste secrets or credential-bearing URLs; never commit env files; actual credentials live only in ignored local env config; `.env.example` keeps placeholders only.
- Never reset/clean/revert user work; preserve uncommitted and unowned changes; keep diffs surgical (no formatting-only churn).
- No branches, commits, pushes, or PRs unless the user agrees. No spending, paid resources, production migrations, or destructive actions without explicit consent. Never delete a successful repo because a later deploy failed.
- Honest evidence only: fresh validation for every claim; historical passes don't count; report failures plainly; never present sample data, heuristics, or AI output as verified system behavior.
- No AI is not the same as offline; cloud-connected is not the same as app-functional. Label everything.
- Use narrowly scoped test accounts/resources for live integrations.
- If a new chat lacks repository access, say so and ask for the minimum needed files — never fabricate inspection or changes.

## 28. Starting another chat

In Zed, attach this file using the `@` file picker and say:

> Use this handoff as context. I am a beginner; handle the technical work for me. Start with the next steps in section 25.

You can also paste the whole file — the short prompt in section 0 is sufficient when the document is attached. Graph attachments are optional if the agent can already read the repository.

Suggested repo copy: once the user approves a commit, save this merged file as `HackStack/HackStack/docs/NEW_CHAT_HANDOFF_v3.md` (app-relative `docs/NEW_CHAT_HANDOFF_v3.md`). The originals remain recoverable: v1 via `git show heet:docs/NEW_CHAT_HANDOFF.md`.

If a new chat lacks repository access, it must say so and ask for the minimum necessary files, not fabricate inspection or changes.

---

*Merged losslessly from: `docs/NEW_CHAT_HANDOFF.md` (v1 planning handoff, sections 1–19, in git history on `heet` as `8e6f945`) + handoff v2 and the full Nov 5, 2026 session transcript (security-slice implementation through the interrupted final validation pass). Where the sources disagreed, the newer status is stated and the older kept as historical.*


