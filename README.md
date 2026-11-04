# HackStack
For student hackathon teams, HackStack turns a 2–3 sentence idea into a working, schema-validated full-stack codebase, live preview, 10-slide pitch deck, and 60-second demo script so that teams spend 100% of their time on their unique feature instead of boilerplate

## Optional Supabase persistence

Copy `.env.example` to `.env.local`, set `OPENROUTER_API_KEY`, and restart the dev server. OpenRouter is the consumer-friendly default: one key can access models from multiple companies, and HackStack discovers available models at runtime instead of hardcoding model names. You can enter a temporary OpenRouter key in the model bar, or use the optional Gemini/OpenAI-compatible choices. If no provider key is configured, HackStack clearly labels the offline fallback and shows the provider failure reason.

For Supabase, add the URL and publishable key for browser auth, optionally add the server-only service role key, then run `supabase/schema.sql` in the Supabase SQL editor. Email magic-link auth, saved projects, generation history, collaborator invites, and private share links are backed by RLS-protected tables. Recent projects can be loaded back into the workbench, pending invites are accepted after sign-in, and share links render read-only project views by default. The app continues to work in offline/demo mode without these variables.

## Agent API

HackStack exposes independent specialist agents at `POST /api/agents/run`: `product`, `architecture`, `ui`, `code`, `pitch`, and `qa`. Each agent accepts the project idea, optional prior context, a gateway provider/model, and an API key, so deployments can run them sequentially, in parallel, or from a background worker. The Supabase schema includes `agent_runs` for queued/running/completed/failed status tracking and resumable project work.
