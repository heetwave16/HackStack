# Project rules (HackStack — Team Blue10.1)
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, Zod, JSZip. Do not add dependencies without asking.
- Always read `PLAN.md`, `STATUS.md`, and `src/types/hackstack.ts` before starting a slice.
- Rule 1: Plan first and wait for human approval before writing or editing any code.
- Rule 2: Build one slice only. Respect the team file ownership in `PLAN.md`; never touch another teammate's files.
- Design tokens: background `#090D16`, accent `#10B981`, text `#F8FAFC`, fonts `Inter` and `JetBrains Mono`.
- Security: Never expose server LLM API keys in client code. Validate all inputs and LLM outputs on the server with Zod.
- Rule 3 & 4: After building a slice, run `npm run lint` and `npx tsc --noEmit`, verify every acceptance criterion in the browser, and report proof before committing.