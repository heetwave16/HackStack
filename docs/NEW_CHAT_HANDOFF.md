# HackStack — complete planning and fresh-chat handoff

Date: November 5, 2026

## Ready-to-paste prompt for the next chat

> Read `docs/NEW_CHAT_HANDOFF.md` completely before working. I am a beginner: handle coding, debugging, tests, technical setup scripts, and documentation yourself. I will give product feedback, make important decisions, and handle unavoidable account authorization/configuration. Explain things plainly; do not expect me to copy application code or diagnose errors.
>
> First inspect the actual repository and working tree safely. Distinguish current facts, historical results, and proposals. Preserve all existing work and never expose secrets. Give me a short, source-verified priority list and recommend the next small slice. Do not start a wholesale rewrite, merge branches, commit, or create a branch without agreement. Do not spend money, provision paid resources, apply production migrations, or perform destructive actions without explicit consent.
>
> Our proposed direction is a guided student hackathon workspace with a useful non-AI core, runnable starters, connected planning/build/deployment/presentation workflows, and optional AI assistance. Confirm the unresolved product decisions in this document, but do not let the undefined “JEV” concept block basic reliability/security triage. The next planning deliverable is a screen-by-screen UX blueprint and domain contracts; the first implementation priority is a bounded security/reliability slice, not all features at once.

---

## 1. How to interpret this handoff

This document consolidates user requirements, earlier implementation history, and the latest read-only planning review. **It is not proof that proposed features are implemented or that historical checks still pass.**

Evidence categories:

- **Historical implementation/validation:** Reported by a previous compacted session. Inspect Git and source before relying on its current state.
- **Source-review findings:** Observed during the latest planning review. Potential bugs were not reproduced by executing the app in that pass. Line numbers are navigation hints and may move.
- **Proposals:** Recommended future product behavior and architecture. Not automatically approved simply because documented.
- **Unresolved:** Needs user clarification, a technical spike, current verification, or external account authorization.

The latest planning review made no application changes and performed no fresh Git inspection, test execution, build, browser test, live AI call, or live Supabase verification. This handoff file is the documentation deliverable, not implementation of the redesign.

## 2. Repository, environment, and historical integration state

- Repository: `heetwave16/HackStack`.
- Editor workspace root: `/Users/heet/Documents/HackStack`.
- **Actual nested Git/application root:** `/Users/heet/Documents/HackStack/HackStack`.
- Paths below are relative to the actual application root unless stated otherwise.
- Stack: Next.js App Router, React, TypeScript, Tailwind, Zod, Supabase.
- Last inspected package declarations included Next `16.4.5`, React `^19.0.0`, Zod `4.6.7`, Vitest `2.1.9`, jsdom `26.1.0`.
- A separate `landing/` Next application exists. Confirm deployment boundaries before consolidating it with the main app.

Historical Git state: branch `heet`, tracking `origin/heet`, HEAD `5582bb4` (merge PR #16). **Not reverified during planning. Do not present it as current without checking.**

### PR history

Reported merged:

- **PR #14 — Harden AI JSON repair and model fallback**, branch `heetwave16-bookish-tribble`: normalization/repair before Zod, removal of incompatible OpenRouter response formatting, retries/fallback models, regression tests.
- **PR #16 — Unify agent patches with Studio workspace**, branch `heetwave16-turbo-lamp`: specialist outputs connected to Preview/Code/Deck/Demo; targeted merging preserves unrelated artifacts; tolerant patch normalization and tests.
- **PR #17 — Redesign Studio layout and interactive preview**, branch `heetwave16-didactic-spoon`: main-canvas NodeGraph removed, AgentWorkbench in rail, four tabs accessible, schema-aware record creation/status interactions. Historical browser smoke covered record creation, KPI update, status transition.

Reported pending/open:

- **PR #15 — Harden OpenRouter routing and agent generation**, branch `origin/heetwave16-legendary-spoon`: discover/rank suitable free text models; exclude unsuitable models; reasoning/token-budget/output-repair handling; retry unavailable models; dependency-safe agent waves; routing/repair tests; ignore local Graphify artifacts. Historical validation reported lint, TypeScript, 13 tests, build, fallback API smoke. Live discovery still needed configured credentials.
- **PR #18 — Persist Studio work and surface AI failures**, branch `origin/heetwave16-probable-goggles`: preset brief starters rather than fake AI success, explicit errors, opt-in offline demo, missing-key actionable 401, localStorage/Supabase snapshot autosave/restore including agents, schema/latest-project changes. Historical validation reported lint, TypeScript, 10 tests, build.

**Verify actual merge state before action.** Neither pending PR was merged during the reviewed local bugfix/planning sessions. They overlap with local changes in `page.tsx`, API routes, agents, and Studio components. Reconcile behavior instead of blindly taking one side.

Preserve: resilient routing/repair, explicit failures, opt-in demo, full snapshots/restore, controlled Preview edits/reset semantics, targeted patches, and the interactive workspace.

## 3. Existing local fixes to preserve

The earlier bugfix session began with a clean tree but ended with uncommitted changes. Do not assume the working tree is still identical.

### Dependencies and tooling

The original `node_modules` did not match the committed lockfile. Missing Supabase and mismatched Next/ESLint/Zod were repaired with:

`npm ci --cache .next/npm-cache --no-audit --no-fund`

Added exact test dependencies `vitest@2.1.9`, `jsdom@26.1.0`; changed test script to `vitest run`; enabled automatic JSX transform in `vitest.config.mjs`. Lockfile churn was checked at the time: no pre-existing package versions changed or entries removed; added test/platform dependency entries.

### Controlled Preview workspace

Files: `src/app/page.tsx`, `src/components/PreviewTab.tsx`, new `src/lib/workspace-state.ts`, new `src/lib/__tests__/preview-workspace.test.ts`.

Reducer state contains current `output` plus separate `previewBaseline`.

Actions:

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

### Reported working-tree ownership

Modified by that session:

- `package.json`, `package-lock.json`, `vitest.config.mjs`
- `src/app/page.tsx`
- `src/components/PreviewTab.tsx`
- `src/components/studio/ProjectPanel.tsx`
- `src/lib/agents.ts`
- `src/lib/__tests__/agents.test.ts`

New:

- `src/lib/workspace-state.ts`
- `src/lib/__tests__/preview-workspace.test.ts`
- `src/lib/__tests__/project-panel.test.ts`

Concurrent/unowned: `.env.example`, `graphify-out/`.

Editor tools previously reformatted whole files. Formatting-only churn was removed using reconstruction and TypeScript AST-equivalence checks. **Keep changes surgical; avoid unrelated reformatting or reconstructing files unnecessarily.**

## 4. Historical validation and limitations

Previously passed:

- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`
- `npm test` — 25 cases in 5 files
- `git diff --check`
- `npm run build -- --webpack`

Default Turbopack build failed in that environment because a PostCSS worker attempted local port binding: `Operation not permitted`. Webpack production build passed; default build configuration was not changed just to bypass the sandbox.

Not established: live AI/provider success, actual Supabase auth/save/load/RLS, complete browser desktop/mobile flows, exported starter correctness across variants.

jsdom tests mock Supabase/dialog behavior. Test files are excluded from ordinary root TypeScript checking, so add separate test-file type-checking rather than equating Vitest success with type safety.

`STATUS.md`, `PLAN.md`, and `docs/journey.md` contain historical claims and event-specific assumptions. Prefer source and fresh checks. An audit found no `.github/workflows` at that time; verify before adding CI.

## 5. Security incident and working-tree safety

A previous concurrent `.env.example` edit contained a real-looking Supabase server secret. **Do not read, display, repeat, or paste the value.** Do not overwrite unowned edits casually.

The user was warned to rotate/revoke it, store actual credentials in ignored local environment configuration, and retain placeholders in example files. **Rotation/revocation and exposure/history remediation remain unverified.** Ask for confirmation without requesting the secret itself.

No credentials were intentionally used for live validation.

Before implementation:

- Inspect current status/diffs safely, without printing secret contents or credential-bearing remote URLs.
- Do not reset/clean/revert user work.
- Never commit environment secrets.
- Do not commit or create branches unless requested.
- Use narrowly scoped test accounts/resources for live integrations.
- No paid/destructive/prod actions without explicit approval.

## 6. What the user wants

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
- Consideration of “JEV” for decision/quality-related behavior, but its meaning is unknown.

The user expects to prompt, review, make product choices, and manage a little configuration — **not manually implement code**.

### Recommended product direction — proposal, not yet confirmed

> Help students turn a problem statement into a feasible MVP, a working project they understand, and a submission backed by evidence — with or without AI.

A guided workspace with runnable starters and external-editor development, not initially a full autonomous in-browser IDE.

Meaningful complexity should come from reliable state, dependency-aware planning, safe integrations, validated templates, change impact, and honest evidence — not feature count or extra agents.

### Unresolved decisions

1. What exactly is **JEV**? Ask for a full name/link. No reference was found in searched project content. Never invent an expansion or make it a core dependency before clarification.
2. Is an app built/run entirely inside HackStack essential, or is guided planning + runnable starter + the student's own editor acceptable? Recommend the latter initially; arbitrary in-app execution is a much larger security/product scope.
3. Beginner/small-team web-app hackathons are the recommended initial scope, not an approved limitation.
4. No visual mockup or exact release calendar has been approved.

Do not block obvious security triage on JEV clarification.

## 7. Proposed UI/UX blueprint

Design around the student's questions: What problem? What can we finish? What next? How build/connect? What really works? What submit?

### Navigation

- **Overview:** next useful action, why it matters, prerequisites/completion check, blockers, deadline, recent changes, last verified version.
- **Brief:** problem/users/constraints/success criteria, rules, assumptions, decisions.
- **Plan:** essential/optional/cut MVP, feature acceptance criteria, dependencies, assignments, effort ranges.
- **Build:** starter/capability choices, setup guidance, code artifacts, prototype, verification.
- **Ship:** repository, deployment, database connection, configuration, release status.
- **Present:** editable deck/story, rehearsal/recording, evidence, submission checklist/snapshot.

These are persistent nonlinear views, not a rigid sequence of locked wizard steps.

### Starting screen

Prominent central question: “What problem is your team trying to solve?”

Actions: Start planning; optional AI refinement; open existing project; explore an explicitly labeled example.

Progressively collect deadline/timezone, team skills/available hours, existing code, event requirements, and constraints. Do not require an API key, full questionnaire, or three cloud integrations before useful work.

### Existing components' future placement

Preview/Code inside Build; Deck/Demo inside Present; agents contextual instead of permanent command-center furniture; models/keys in advanced settings; connections contextual plus central management; pipeline reflects actual operations instead of implied downstream success.

Header prioritizes project name, deadline, local-versus-cloud save state, and team.

### Visual and interaction rules

Calm readable hierarchy, consistent tokens/components, one primary action per screen, optional contextual drawer rather than three crowded permanent panels. Accessible light/dark themes, keyboard/focus, mobile layouts, reduced motion, clear text status rather than color alone.

Design empty/loading/failed/permission-denied/conflict/stale/unsaved/success states before implementation. Explain recovery beside the affected action. No synthetic business metrics presented as project progress.

## 8. Non-AI core that must stand alone

- Manual structured brief and decision history.
- MVP essential/optional/cut classification.
- Editable tasks with stable IDs, dependencies, owners, effort ranges, blockers, completion checks, and small learning explanations.
- Transparent rule-based deadline/scope advice, not certainty about feasibility.
- Finite vetted starter capabilities configured through explicit choices.
- README/setup/license builders; preserve required third-party notices.
- Save/recover/restore/export.
- Manual document/presentation editing, submission requirements and evidence.
- Demo rehearsal and recording where browser support permits.

A useful task is “Allow a teammate to sign in and prove another team's project is inaccessible,” with prerequisites and completion evidence — not simply “implement auth.”

**Do not promise arbitrary natural-language-to-working-app without AI.** The deterministic system supports finite recipes/capabilities; unsupported features require custom implementation and must be labeled accordingly.

Certify one genuinely runnable starter family first. A local-workflow starter can prove the first slice; add a separately tested Supabase-backed recipe later. Keep legacy Prisma compatibility while deliberately choosing the future recipe. Avoid selectable stack claims without real build/export support.

**No AI is not the same as offline.** Clearly distinguish device save, cloud sync, last-known provider state, and unavailable network actions. Do not promise first-use offline support without building/testing it.

## 9. Connectedness and adaptable architecture

Trace relationships:

Problem + rules → accepted MVP → features + acceptance criteria → tasks → artifacts → build/workflow evidence → commit/deployment/submission → pitch/demo.

Each claim should refer to evidence or be labeled planned. A deployed page does not establish correct authentication/database behavior.

### Change handling

A brief/schema/scope change should identify possibly stale tasks/code/forms/tests/docs/demo steps and show a reviewable impact set. Preserve the last working snapshot and manual edits.

**Accepting a plan does not automatically update code, GitHub, database schema, deployment, and deck.** External actions need separate operations/results/consent. No silent overwrites, migrations, or redeploys.

### Modular monolith

Keep Next.js/TypeScript/Tailwind/Zod/Supabase and one deployable app, with focused boundaries:

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

### Data contracts

Evolve `HackStackOutput` into a legacy compatibility adapter, not the whole future product model. Do not replace it with another enormous globally coupled object.

Proposed concepts:

- Project/membership/event profile.
- BriefRevision with accepted decisions/constraints.
- Feature with scope/acceptance criteria/capabilities.
- Task with dependencies/owner/status/evidence.
- Artifact with version/origin/input dependencies/manual changes.
- Connection with owner/scopes/provider resource references.
- Operation with action/result/retry and returned resource IDs.
- CheckResult with type/outcome/exact artifact or commit/timestamp.

Use relational data where relationships/authorization matter, versioned JSON for appropriate documents. Credentials stay separate, encrypted and server-only — never browser snapshots/localStorage/prompts.

Bind asynchronous results to project/base revision; reject stale responses. Use revision-aware saves/conflicts. Validate restored JSON. Migrate old snapshots explicitly: an original baseline absent from legacy data cannot be reconstructed magically.

Typed field/capability definitions can drive supported UI rendering, validation, tasks, and starter options. New capabilities still need renderers/rules/tests/migrations. Adaptability means contained predictable changes, not automatic arbitrary propagation.

## 10. Source-review findings to revalidate first

These findings were inspected in source, not executed reproductions.

### Highest-priority security

- `src/app/api/agents/run/route.ts:12–28`: deployment credential fallback combined with caller-controlled `baseUrl`.
- `src/lib/ai-gateway.ts:39–58`: bearer token sent to that endpoint without central endpoint policy.
- Fix server-credential egress first: fixed approved provider hosts for deployment keys; central endpoint/SSRF rules, authorization and abuse quotas. Custom endpoints must not inherit server keys.
- Generate route checks HTTPS/some hostnames, not comprehensive private-address/DNS/redirect safety.

### Validation/generation

- `src/lib/validator.ts:170–177`: duplicate column repair can fail to progress for `['field2', 'field2', 'status']`. Make bounded and add regression.
- Detailed `HACKSTACK_SYSTEM_PROMPT` exists at `src/lib/prompts.ts:3–71`, but generation route around `107–114` uses a short generic prompt. Fix actual schema prompt wiring/provider defaults.
- `passesGeneratedCodeChecks` around validator `218–226` uses regex heuristics, not actual compilation. `CodeTab` currently says “Static code check”; do not falsely claim the UI says a compiler ran.
- Agent patches are permissive and lack complete post-merge scope/contract enforcement. Changed-columns-only patches can leave old row keys. AI QA may set check flags. System evidence must not be model-awarded.

### Identity/persistence/permissions

- Page owns `projectId` separately from workspace. Replacing output may retain a loaded project's save target; late responses have no project/revision isolation.
- Agent context uses previous raw outputs rather than current accepted workspace; hardcoded ordering differs from dependency metadata.
- Output-only persistence omits original reset baseline; Demo checklist is local component state.
- Reads cast rather than validate stored JSON; share behavior around unsaved revisions is ambiguous.
- `updated_at` had insertion default but no update trigger found.
- `supabase/schema.sql:82–97`: inspected policies do not consistently enforce owner/editor/viewer roles; member access permits invitation/share actions while editors cannot update. Browser ownership fields also need review. Verify with real RLS, not mocks.

### Product honesty/export

- Preview manipulates local sample rows, not generated backend execution.
- `src/templates/golden-template.ts:63–73` exports a static “Starter ready” page, not Studio Preview.
- `src/components/studio/models.ts:18–21` advertises multiple stacks while packaging uses a fixed Next/Prisma template.
- `src/lib/packager.ts:36–49` accepts additional file destinations/collisions; constrain paths/reserved files/overwrite policy and inspect secret leakage risks.
- Header Share copies page URL (`page.tsx:224–232`), distinct from saved-project share.
- Preview increments a leading-number first metric synthetically; do not confuse with verified domain calculations.

## 11. Integration plan and security boundaries

Official documentation was checked November 5, 2026. Capabilities below are documented, **not live-tested in HackStack**. Recheck before implementation.

### Four separate concerns

1. Sign into HackStack through Supabase Auth (Google/GitHub identity).
2. Authorize HackStack to act on a provider account.
3. Select accessible repository/project/deployment resources.
4. Implement authentication inside the student's application.

Do not conflate these. HackStack's database/control plane is separate from student application databases.

### GitHub

Separate actions: connect existing repository; create truly empty repository; initialize README/license/gitignore; publish a reviewed starter.

Ask explicit owner, name, description, visibility, README choice, license including none, gitignore. API defaults may be public: do not rely on defaults. Optional project license does not remove third-party obligations.

Prefer least-privilege GitHub App authorization. **October 13, 2026 documentation introduced `repository_creation:write`; do not repeat the outdated blanket assertion that GitHub Apps cannot create repositories.** Spike delegated-user/installation token behavior, personal/org ownership, selected-repository access and organization approvals. Contents write only when custom file commits are needed.

README/license initialization is not truly empty; empty repos are not deployable. No automatic overwrite of existing code. Begin with reviewed one-way publish, not complex bidirectional synchronization.

### Vercel

Separate integration authorization from identity login. Start with authorized project/deployment reads and existing project selection; add project creation/deploy writes later.

Vercel's GitHub access is separate from HackStack's. Confirm access to newly created repositories and team ownership. Management permissions for Sign in with Vercel were documented as private beta; do not assume ordinary sign-in grants management.

### Supabase

Supabase Auth is not Management OAuth. Project publishable/secret keys are not platform-management credentials.

Start with metadata reads and explicit selection of an existing project through Management OAuth, or clearly labeled manual attachment. Mere connection does not need a database password/service secret. Schema/auth/config writes require separate permissions, review, and consent.

### Shared integration rules

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

References:

- https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
- https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/
- https://vercel.com/docs/integrations/create-integration/vercel-api-integrations
- https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration
- https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-github

## 12. Optional AI and quality controls

Offer help at actual bottlenecks: clarify problem, review deadline scope, explain build error, suggest tests, improve pitch from verified features. Beginners should not choose agent/model before making progress.

Use a deterministic versioned prompt registry selected by task/context/capabilities/allowed scope/budget. No extra model needed to choose every prompt.

Proposed sequence: clarify → propose scope/assumptions → student acceptance → architecture/design when useful → bounded code proposal → separate actual verification → evidence-aligned presentation.

Context: authoritative project snapshot/version, minimal needed data, no credentials; explain external sharing. Results: project ID/base revision, scoped diff, assumptions, verification steps. Reject stale responses and review consequential changes. Agents cannot bypass authorization or consent for cloud/database writes.

Budget/cancel/timeout/retry controls; no implicit paid fallback. Optional copyable prompts can help without built-in API access. Failure preserves current work; demo fallback is explicit opt-in, never fake success.

Anti-slop means traceable requirements, bounded supported capabilities, real tests, evidence, labeled assumptions, provenance, small changes, and human decisions. No fabricated research/users/metrics/novelty or model-awarded test passes. AI cannot certify originality or human feasibility alone.

JEV remains undefined and deferred.

## 13. Unknowns and risks to account for

- Event rules can forbid templates, AI, prior work or late changes. Capture source/timezone and organizer questions; do not claim compliance from incomplete data.
- Student understanding: can they explain and modify the code, not just download it?
- Team-owned versus personal resources, handoff, billing, school OAuth restrictions.
- Provider registration/approval, quotas/free-tier changes, costs; no “free forever” promises.
- Student privacy, retention/deletion, AI data sharing, secrets in generated content.
- External Git edits/source-of-truth drift and branch conflicts.
- Stale checks/deployment evidence after code changes.
- Template combinations/dependency compatibility/license notices/export paths.
- Browser recorder permissions/support and recording state during navigation.
- Cloud-connected is not app-functional; no-AI is not internet-independent.
- Submission snapshot must not be silently replaced by post-deadline edits.

## 14. Delivery phases and exit criteria

No precise calendar is promised. Estimate after baseline triage and provider spikes. Each slice should be small, testable, reversible.

### Phase 0 — Safe/reliable baseline

Verify Git/source/PR status, preserve local fixes and unowned changes, reproduce high-risk findings, fix credential egress/bounded repair/prompt wiring/project isolation, reconcile #15/#18 deliberately, verify persistence/permissions and CI.

Exit: no silent loss across navigation/reload/failure/project switching; explicit provider errors; security regressions tested; meaningful baseline save/reset semantics preserved.

### Phase 1 — Product and UX blueprint

Confirm audience/non-goals and execution scope; navigation, screen flows, design tokens, fixture-backed clickable prototype, all error/empty/loading/conflict states, beginner review. Define domain contracts alongside screen behavior before broad implementation.

Exit: beginner identifies next action and distinguishes planning/sample Preview/code/local running app/deployment.

### Phase 2 — Versioned workspace foundation

Project identity/revisions, snapshots/adapters/migration, durable brief/tasks/checklists/docs, local recovery/cloud status, validated restore, role matrix, conflict-aware saves and stale-result rejection.

Exit: full roundtrip including current edited output and intended reset baseline; no cross-project/account leakage; concurrent edits conflict rather than silently overwrite.

### Phase 3 — One complete no-AI building path

Manual brief → accepted MVP → dependency roadmap → one real starter → acceptance workflow → save → honest demo/submission.

Exit: beginner can run, explain, and make a small change without an AI key. Do not require three provider integrations to establish this value.

### Phase 4 — Incremental cloud connections

Identity then GitHub create/connect/publish; Vercel/Supabase read-only connection first; additional writes only after technical spikes and explicit consent. Manual provider workflows remain available.

Exit: real test-account proof of least scopes, denial/revocation, ownership, retries, no duplicates and recoverable partial failure.

### Phase 5 — Contextual AI

Versioned prompts, accepted-context dependency orchestration, scoped proposals, provider budgets/fallback discipline, eval cases for ordinary/vague/infeasible/contradictory briefs.

Exit: improves user outcomes but manual path works with zero AI calls; no fabricated success or loss on failure.

### Phase 6 — Broaden/polish

More certified templates/capabilities, evidence/change-impact improvements, team features, accessibility/performance and onboarding based on user tests.

Defer arbitrary in-app untrusted code execution, full IDE, real-time multiplayer, marketplace, generic agent/plugin platform and microservices unless justified by validated needs.

## 15. Verification plan and success measures

Fresh validation is required; never reuse historical pass claims.

- Unit/contracts: reducer/reset/patch invariants, bounded malformed-output repair, no-key errors/routing, allowed patch scopes, schema migration, stale async results.
- Persistence: full snapshot restore, project identity, timestamps, account switches, conflict handling, legacy behavior.
- Authorization: owner/editor/viewer/outsider/anonymous against actual test Supabase RLS. Mocks alone cannot verify it.
- Exports: exact supported variants install/build/test in isolation; archive paths/overwrites constrained; no production credentials; never execute untrusted generated content with deployment secrets.
- Provider tests: safe accounts/resources, callback denial/replay, missing scopes, revoke/refresh, wrong owner/team, timeout/retry reconciliation and partial failures.
- Browser desktop/mobile: create record → KPI/status → tabs → pitch-only patch → reset → save/reload → project/account switching; checklist persistence, errors/opt-in demo.
- Accessibility: keyboard/focus, contrast, reduced motion, screen reader statuses, responsive layout.
- CI: inspect configuration then run clean install, lint, app TypeScript, separate test TypeScript, tests, production build, diff check. Historical commands are in section 4. Report sandbox/build restrictions and distinguish webpack workaround.

Core success metrics: time to working increment, next-task comprehension, code understanding/modification, accurate awareness of unbuilt/unverified work, persistence/recovery, truthful submission — not quantity of generated artifacts.

Proposed user-study targets, not observed results: test around eight beginners; perhaps six can run a core workflow within 45 minutes including setup, explain the next task/check and make a small modification. Everyone should distinguish sample Preview/local app/deployment. Adjust targets after actual research.

## 16. Graphify and documentation navigation

User supplied `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` dated November 5, 2026: 544 nodes, 1,055 edges, 25 communities; reported 99% extracted/1% inferred. Hubs include `HackStackStudioPage` and `HackStackOutput`, 23 edges each. No import cycles detected.

Use the installed Graphify skill and existing graph first for structural queries when tools allow, then verify source. Latest planning used the supplied report/source, not executed CLI traversal. Do not rebuild for ordinary queries or overwrite unowned graph artifacts.

No cycles does not prove loose coupling. Communities include landing app, dependencies/configuration and docs; avoid interpreting metrics as product-quality scores. Graphify is a development navigation aid, not a required runtime knowledge-graph feature.

## 17. Who does what

### User / beginner

- Explain goals and priorities; choose product/visual direction.
- Clarify JEV and whether an in-app runtime is essential.
- Review screenshots, flows and acceptance behavior.
- Own provider accounts; perform unavoidable login/consent/configuration.
- Rotate exposed credentials and approve bills/production/destructive actions.
- Do not paste secrets into chat.

### Coding agent

- Inspect repository safely and verify claims.
- Propose bounded slices in plain language, then implement agreed code/config/tests/docs.
- Handle dependency work, scripts, debugging, test execution and migration preparation.
- Preserve unowned/uncommitted work; avoid unrelated churn.
- Specify exact permissions and explain unavoidable setup one step at a time.
- Never ask the beginner to manually copy application code as the implementation method.
- Do not claim tests, changes, live connections or deployments without evidence.
- No branches/commits unless requested; no production migration/paid/destructive action without explicit approval.

## 18. Exact next steps for a fresh agent

1. Read this file. Confirm the nested app root and inspect safe Git status/log/upstream/remotes/diffs without exposing secrets.
2. Determine what is actually present: local fixes, PR #15/#18 behavior, user edits, graph artifacts. Preserve all of it.
3. Ask the unresolved product questions with recommended defaults; no need to make the user repeat this history.
4. Revalidate highest-risk source findings and provide a short priority list. Agree one Phase 0 slice before implementation.
5. Prepare the Phase 1 screen-by-screen blueprint and proposed contracts; distinguish decisions from assumptions.
6. Implement and validate only the agreed slice. Report affected files, actual checks, remaining risks, and the next useful decision.

Do not treat this document as authorization for the entire roadmap or blind PR integration.

## 19. Starting another chat

In Zed, attach this file using the `@` file picker and say:

> Use this handoff as context. I am a beginner; handle the technical work for me. Start with the next steps in section 18.

You can also paste the whole file. The short prompt at the top is sufficient when the document is attached. Graph attachments are optional if the agent can already read the repository.

Workspace-relative file: `HackStack/HackStack/docs/NEW_CHAT_HANDOFF.md`.

Actual app-relative file: `docs/NEW_CHAT_HANDOFF.md`.

If a new chat lacks repository access, it must say so and ask for the minimum necessary files, not fabricate inspection or changes.
