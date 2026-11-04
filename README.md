# HackStack
For student hackathon teams, HackStack turns a 2–3 sentence idea into a working, schema-validated full-stack codebase, live preview, 10-slide pitch deck, and 60-second demo script so that teams spend 100% of their time on their unique feature instead of boilerplate

## Optional Supabase persistence

Copy `.env.example` to `.env.local`, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then run `supabase/schema.sql` in the Supabase SQL editor. Generation runs are persisted server-side in `hackstack_runs`; the app continues to work without these variables.
